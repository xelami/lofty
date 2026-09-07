import type { FastifyInstance } from "fastify"

import { db } from "@lofty/db"
import {
  desktops,
  desktopMembers,
  desktopItems,
  folders,
  files,
} from "@lofty/db/schema"
import { eq, and } from "drizzle-orm"

import { createDesktopSchema, updateDesktopSchema } from "@lofty/validation"
import { canEditDesktop } from "../auth/permissions.js"
import { broadcastEvent } from "../realtime/events.js"
import { z } from "zod"

const desktopItemPositionSchema = z.object({
  x: z.number().finite().min(0).max(100000),
  y: z.number().finite().min(0).max(100000),
})

const bulkDesktopItemPositionSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string().uuid(),
        x: z.number().finite().min(0).max(100000),
        y: z.number().finite().min(0).max(100000),
      }),
    )
    .min(1)
    .max(500),
})

const transferDesktopSchema = z.object({
  userId: z.string().uuid(),
})

export async function desktopRoutes(app: FastifyInstance) {
  /*
   * GET /desktops
   *
   * Get all desktops the current user belongs to.
   */
  app.get("/", async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: "Not authenticated",
      })
    }

    const result = await db
      .select({
        id: desktops.id,
        name: desktops.name,
        ownerId: desktops.ownerId,
        wallpaper: desktops.wallpaper,
        settings: desktops.settings,
        createdAt: desktops.createdAt,
        updatedAt: desktops.updatedAt,
        role: desktopMembers.role,
      })
      .from(desktopMembers)
      .innerJoin(desktops, eq(desktopMembers.desktopId, desktops.id))
      .where(eq(desktopMembers.userId, request.user.id))

    return {
      desktops: result,
    }
  })

  /*
   * POST /desktops
   *
   * Create a desktop.
   */
  app.post("/", async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: "Not authenticated",
      })
    }

    const parsed = createDesktopSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: parsed.error.flatten(),
      })
    }

    const [desktop] = await db
      .insert(desktops)
      .values({
        name: parsed.data.name,
        ownerId: request.user.id,
      })
      .returning()

    if (!desktop) {
      return reply.status(500).send({
        error: "Failed to create desktop",
      })
    }

    await db.insert(desktopMembers).values({
      desktopId: desktop.id,
      userId: request.user.id,
      role: "owner",
    })

    return reply.status(201).send({
      desktop,
    })
  })

  /*
   * GET /desktops/:id/items
   *
   * Get saved positions for all desktop items.
   */
  app.get("/:id/items", async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: "Not authenticated",
      })
    }

    const { id } = request.params as {
      id: string
    }

    const membership = await db
      .select({
        role: desktopMembers.role,
      })
      .from(desktopMembers)
      .where(
        and(
          eq(desktopMembers.desktopId, id),
          eq(desktopMembers.userId, request.user.id),
        ),
      )
      .limit(1)

    if (membership.length === 0) {
      return reply.status(404).send({
        error: "Desktop not found",
      })
    }

    const items = await db
      .select({
        id: desktopItems.id,
        desktopId: desktopItems.desktopId,
        folderId: desktopItems.folderId,
        fileId: desktopItems.fileId,
        x: desktopItems.x,
        y: desktopItems.y,
        createdAt: desktopItems.createdAt,
        updatedAt: desktopItems.updatedAt,
      })
      .from(desktopItems)
      .where(eq(desktopItems.desktopId, id))

    return {
      items,
    }
  })

  /*
   * PATCH /desktops/:id/items/:itemId
   *
   * Save the position of a folder or file on the desktop.
   */
  app.patch("/:id/items/:itemId", async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: "Not authenticated",
      })
    }

    const { id, itemId } = request.params as {
      id: string
      itemId: string
    }

    const parsed = desktopItemPositionSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid position",
        details: parsed.error.flatten(),
      })
    }

    const membership = await db
      .select({
        role: desktopMembers.role,
      })
      .from(desktopMembers)
      .where(
        and(
          eq(desktopMembers.desktopId, id),
          eq(desktopMembers.userId, request.user.id),
        ),
      )
      .limit(1)

    if (membership.length === 0) {
      return reply.status(404).send({
        error: "Desktop not found",
      })
    }

    if (!canEditDesktop(membership[0]!.role)) {
      return reply.status(403).send({
        error: "You do not have permission to move items",
      })
    }

    /*
     * Determine whether this ID belongs to a folder or file
     * on this particular desktop.
     */
    const folder = await db
      .select({
        id: folders.id,
      })
      .from(folders)
      .where(and(eq(folders.id, itemId), eq(folders.desktopId, id)))
      .limit(1)

    let folderId: string | null = null
    let fileId: string | null = null

    if (folder.length > 0) {
      folderId = folder[0]!.id
    } else {
      const file = await db
        .select({
          id: files.id,
        })
        .from(files)
        .where(and(eq(files.id, itemId), eq(files.desktopId, id)))
        .limit(1)

      if (file.length === 0) {
        return reply.status(404).send({
          error: "Desktop item not found",
        })
      }

      fileId = file[0]!.id
    }

    /*
     * Check whether this item already has a saved position.
     */
    const existing = folderId
      ? await db
          .select({
            id: desktopItems.id,
          })
          .from(desktopItems)
          .where(eq(desktopItems.folderId, folderId))
          .limit(1)
      : await db
          .select({
            id: desktopItems.id,
          })
          .from(desktopItems)
          .where(eq(desktopItems.fileId, fileId!))
          .limit(1)

    let item

    if (existing.length > 0) {
      ;[item] = await db
        .update(desktopItems)
        .set({
          x: parsed.data.x,
          y: parsed.data.y,
          updatedAt: new Date(),
        })
        .where(eq(desktopItems.id, existing[0]!.id))
        .returning()
    } else {
      ;[item] = await db
        .insert(desktopItems)
        .values({
          desktopId: id,
          folderId,
          fileId,
          x: parsed.data.x,
          y: parsed.data.y,
        })
        .returning()
    }

    if (!item) {
      return reply.status(500).send({
        error: "Failed to save desktop item position",
      })
    }

    console.log("📡 BROADCASTING ITEM MOVE", {
      desktopId: id,
      itemId: item.id,
      folderId: item.folderId,
      fileId: item.fileId,
      x: item.x,
      y: item.y,
    })

    broadcastEvent(id, {
      type: "desktop.item.moved",
      itemId: item.id,
      folderId: item.folderId,
      fileId: item.fileId,
      x: item.x,
      y: item.y,
    })

    return {
      item,
    }
  })

  /*
   * PATCH /desktops/:id/items/positions
   *
   * Save the positions of multiple folders/files at once.
   */
  app.patch("/:id/items/positions", async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: "Not authenticated",
      })
    }

    const { id } = request.params as {
      id: string
    }

    const parsed = bulkDesktopItemPositionSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid positions",
        details: parsed.error.flatten(),
      })
    }

    const membership = await db
      .select({
        role: desktopMembers.role,
      })
      .from(desktopMembers)
      .where(
        and(
          eq(desktopMembers.desktopId, id),
          eq(desktopMembers.userId, request.user.id),
        ),
      )
      .limit(1)

    if (membership.length === 0) {
      return reply.status(404).send({
        error: "Desktop not found",
      })
    }

    if (!canEditDesktop(membership[0]!.role)) {
      return reply.status(403).send({
        error: "You do not have permission to move items",
      })
    }

    /*
     * Resolve every supplied ID to either a folder or a file
     * belonging to this desktop.
     */
    const resolvedItems: Array<{
      id: string
      folderId: string | null
      fileId: string | null
      x: number
      y: number
    }> = []

    for (const position of parsed.data.items) {
      const [folder] = await db
        .select({
          id: folders.id,
        })
        .from(folders)
        .where(and(eq(folders.id, position.id), eq(folders.desktopId, id)))
        .limit(1)

      if (folder) {
        resolvedItems.push({
          id: position.id,
          folderId: folder.id,
          fileId: null,
          x: position.x,
          y: position.y,
        })

        continue
      }

      const [file] = await db
        .select({
          id: files.id,
        })
        .from(files)
        .where(and(eq(files.id, position.id), eq(files.desktopId, id)))
        .limit(1)

      if (!file) {
        return reply.status(404).send({
          error: `Desktop item not found: ${position.id}`,
        })
      }

      resolvedItems.push({
        id: position.id,
        folderId: null,
        fileId: file.id,
        x: position.x,
        y: position.y,
      })
    }

    /*
     * Update/insert everything atomically.
     */
    const savedItems = await db.transaction(async (tx) => {
      const results = []

      for (const position of resolvedItems) {
        const existing = position.folderId
          ? await tx
              .select({
                id: desktopItems.id,
              })
              .from(desktopItems)
              .where(eq(desktopItems.folderId, position.folderId))
              .limit(1)
          : await tx
              .select({
                id: desktopItems.id,
              })
              .from(desktopItems)
              .where(eq(desktopItems.fileId, position.fileId!))
              .limit(1)

        let item

        if (existing.length > 0) {
          ;[item] = await tx
            .update(desktopItems)
            .set({
              x: position.x,
              y: position.y,
              updatedAt: new Date(),
            })
            .where(eq(desktopItems.id, existing[0]!.id))
            .returning()
        } else {
          ;[item] = await tx
            .insert(desktopItems)
            .values({
              desktopId: id,
              folderId: position.folderId,
              fileId: position.fileId,
              x: position.x,
              y: position.y,
            })
            .returning()
        }

        if (!item) {
          throw new Error("Failed to save desktop item position")
        }

        results.push(item)
      }

      return results
    })

    /*
     * Broadcast every changed position.
     */
    for (const item of savedItems) {
      broadcastEvent(id, {
        type: "desktop.item.moved",
        itemId: item.id,
        folderId: item.folderId,
        fileId: item.fileId,
        x: item.x,
        y: item.y,
      })
    }

    return {
      items: savedItems,
    }
  })

  /*
   * GET /desktops/:id
   */
  app.get("/:id", async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: "Not authenticated",
      })
    }

    const { id } = request.params as {
      id: string
    }

    const result = await db
      .select({
        id: desktops.id,
        name: desktops.name,
        ownerId: desktops.ownerId,
        wallpaper: desktops.wallpaper,
        createdAt: desktops.createdAt,
        settings: desktops.settings,
        updatedAt: desktops.updatedAt,
        role: desktopMembers.role,
      })
      .from(desktopMembers)
      .innerJoin(desktops, eq(desktopMembers.desktopId, desktops.id))
      .where(
        and(
          eq(desktopMembers.desktopId, id),
          eq(desktopMembers.userId, request.user.id),
        ),
      )
      .limit(1)

    const desktop = result[0]

    if (!desktop) {
      return reply.status(404).send({
        error: "Desktop not found",
      })
    }

    return {
      desktop,
    }
  })

  /*
   * PATCH /desktops/:id
   *
   * Update desktop settings.
   */
  app.patch("/:id", async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: "Not authenticated",
      })
    }

    const { id } = request.params as {
      id: string
    }

    const parsed = updateDesktopSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: parsed.error.flatten(),
      })
    }

    const membership = await db
      .select({
        role: desktopMembers.role,
      })
      .from(desktopMembers)
      .where(
        and(
          eq(desktopMembers.desktopId, id),
          eq(desktopMembers.userId, request.user.id),
        ),
      )
      .limit(1)

    if (membership.length === 0) {
      return reply.status(404).send({
        error: "Desktop not found",
      })
    }

    if (!canEditDesktop(membership[0]!.role)) {
      return reply.status(403).send({
        error: "Only the desktop owner can modify it",
      })
    }

    const existing = await db
      .select({
        settings: desktops.settings,
      })
      .from(desktops)
      .where(eq(desktops.id, id))
      .limit(1)

    const currentSettings = existing[0]?.settings

    if (!currentSettings) {
      return reply.status(404).send({
        error: "Desktop not found",
      })
    }

    const [desktop] = await db
      .update(desktops)
      .set({
        ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),

        ...(parsed.data.wallpaper !== undefined
          ? { wallpaper: parsed.data.wallpaper }
          : {}),

        ...(parsed.data.settings
          ? {
              settings: {
                ...currentSettings,
                ...parsed.data.settings,

                theme: {
                  ...currentSettings?.theme,
                  ...parsed.data.settings.theme,
                },

                layout: {
                  ...currentSettings?.layout,
                  ...parsed.data.settings.layout,
                },
              },
            }
          : {}),
        updatedAt: new Date(),
      })
      .where(eq(desktops.id, id))
      .returning()

    if (!desktop) {
      return reply.status(404).send({
        error: "Desktop not found",
      })
    }

    return {
      desktop,
    }
  })

  /*
   * POST /desktops/:id/transfer
   *
   * Transfer ownership of a desktop to an existing member.
   */
  app.post("/:id/transfer", async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: "Not authenticated",
      })
    }

    const { id } = request.params as {
      id: string
    }

    const parsed = transferDesktopSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Invalid request",
        details: parsed.error.flatten(),
      })
    }

    const { userId: newOwnerId } = parsed.data

    if (newOwnerId === request.user.id) {
      return reply.status(400).send({
        error: "You are already the owner of this desktop",
      })
    }

    const membership = await db
      .select({
        role: desktopMembers.role,
      })
      .from(desktopMembers)
      .where(
        and(
          eq(desktopMembers.desktopId, id),
          eq(desktopMembers.userId, request.user.id),
        ),
      )
      .limit(1)

    if (membership.length === 0) {
      return reply.status(404).send({
        error: "Desktop not found",
      })
    }

    if (membership[0]!.role !== "owner") {
      return reply.status(403).send({
        error: "Only the desktop owner can transfer ownership",
      })
    }

    const targetMembership = await db
      .select({
        userId: desktopMembers.userId,
        role: desktopMembers.role,
      })
      .from(desktopMembers)
      .where(
        and(
          eq(desktopMembers.desktopId, id),
          eq(desktopMembers.userId, newOwnerId),
        ),
      )
      .limit(1)

    if (targetMembership.length === 0) {
      return reply.status(400).send({
        error: "The new owner must already be a member of this desktop",
      })
    }

    await db.transaction(async (tx) => {
      await tx
        .update(desktops)
        .set({
          ownerId: newOwnerId,
          updatedAt: new Date(),
        })
        .where(eq(desktops.id, id))

      await tx
        .update(desktopMembers)
        .set({
          role: "editor",
        })
        .where(
          and(
            eq(desktopMembers.desktopId, id),
            eq(desktopMembers.userId, request.user!.id),
          ),
        )

      await tx
        .update(desktopMembers)
        .set({
          role: "owner",
        })
        .where(
          and(
            eq(desktopMembers.desktopId, id),
            eq(desktopMembers.userId, newOwnerId),
          ),
        )
    })

    return {
      success: true,
      message: "Desktop ownership transferred successfully",
      ownerId: newOwnerId,
    }
  })

  /*
   * DELETE /desktops/:id
   *
   * Delete a desktop.
   *
   * Only the owner can permanently delete it.
   */
  app.delete("/:id", async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({
        error: "Not authenticated",
      })
    }

    const { id } = request.params as {
      id: string
    }

    const membership = await db
      .select({
        role: desktopMembers.role,
      })
      .from(desktopMembers)
      .where(
        and(
          eq(desktopMembers.desktopId, id),
          eq(desktopMembers.userId, request.user.id),
        ),
      )
      .limit(1)

    if (membership.length === 0) {
      return reply.status(404).send({
        error: "Desktop not found",
      })
    }

    if (membership[0]!.role !== "owner") {
      return reply.status(403).send({
        error: "Only the desktop owner can delete it",
      })
    }

    await db.delete(desktops).where(eq(desktops.id, id))

    return {
      success: true,
    }
  })
}
