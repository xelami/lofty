import { db } from "@lofty/db";
import { desktopMembers, folders, files } from "@lofty/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET_NAME } from "../lib/r2.js";
import { createFolderSchema, updateFolderSchema } from "@lofty/validation";
import { broadcastToDesktop } from "../services/realtime.js";
async function getMembership(desktopId, userId) {
    const result = await db
        .select({
        role: desktopMembers.role,
    })
        .from(desktopMembers)
        .where(and(eq(desktopMembers.desktopId, desktopId), eq(desktopMembers.userId, userId)))
        .limit(1);
    return result[0];
}
async function getFolder(desktopId, folderId) {
    const result = await db
        .select()
        .from(folders)
        .where(and(eq(folders.id, folderId), eq(folders.desktopId, desktopId)))
        .limit(1);
    return result[0];
}
async function getDescendantFolderIds(desktopId, rootFolderId) {
    const allFolders = await db
        .select({
        id: folders.id,
        parentFolderId: folders.parentFolderId,
    })
        .from(folders)
        .where(eq(folders.desktopId, desktopId));
    const folderIds = new Set([rootFolderId]);
    let changed = true;
    while (changed) {
        changed = false;
        for (const folder of allFolders) {
            if (folder.parentFolderId &&
                folderIds.has(folder.parentFolderId) &&
                !folderIds.has(folder.id)) {
                folderIds.add(folder.id);
                changed = true;
            }
        }
    }
    return [...folderIds];
}
export async function folderRoutes(app) {
    /*
     * GET /desktops/:desktopId/folders
     *
     * List folders.
     *
     * No parentFolderId = root folders.
     */
    app.get("/:desktopId/folders", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        const { desktopId } = request.params;
        const { parentFolderId } = request.query;
        const membership = await getMembership(desktopId, request.user.id);
        if (!membership) {
            return reply.status(404).send({
                error: "Desktop not found",
            });
        }
        const result = await db
            .select({
            id: folders.id,
            desktopId: folders.desktopId,
            parentFolderId: folders.parentFolderId,
            name: folders.name,
            createdBy: folders.createdBy,
            createdAt: folders.createdAt,
            updatedAt: folders.updatedAt,
        })
            .from(folders)
            .where(parentFolderId
            ? and(eq(folders.desktopId, desktopId), eq(folders.parentFolderId, parentFolderId))
            : and(eq(folders.desktopId, desktopId), isNull(folders.parentFolderId)));
        return {
            folders: result,
        };
    });
    /*
     * POST /desktops/:desktopId/folders
     *
     * Create a folder.
     */
    app.post("/:desktopId/folders", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        const { desktopId } = request.params;
        const membership = await getMembership(desktopId, request.user.id);
        if (!membership) {
            return reply.status(404).send({
                error: "Desktop not found",
            });
        }
        if (membership.role !== "owner" && membership.role !== "editor") {
            return reply.status(403).send({
                error: "You do not have permission to create folders",
            });
        }
        const parsed = createFolderSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Invalid request",
                details: parsed.error.flatten(),
            });
        }
        const { name, parentFolderId } = parsed.data;
        /*
         * If this is a nested folder, make sure
         * the parent belongs to this desktop.
         */
        if (parentFolderId) {
            const parent = await getFolder(desktopId, parentFolderId);
            if (!parent) {
                return reply.status(400).send({
                    error: "Parent folder not found",
                });
            }
        }
        const [folder] = await db
            .insert(folders)
            .values({
            desktopId,
            parentFolderId: parentFolderId ?? null,
            name,
            createdBy: request.user.id,
        })
            .returning();
        if (folder) {
            broadcastToDesktop(desktopId, {
                type: "folder.created",
                folder,
            });
        }
        return reply.status(201).send({
            folder,
        });
    });
    /*
     * PATCH /desktops/:desktopId/folders/:folderId
     *
     * Rename / move a folder.
     */
    app.patch("/:desktopId/folders/:folderId", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        const { desktopId, folderId } = request.params;
        const membership = await getMembership(desktopId, request.user.id);
        if (!membership) {
            return reply.status(404).send({
                error: "Desktop not found",
            });
        }
        if (membership.role !== "owner" && membership.role !== "editor") {
            return reply.status(403).send({
                error: "You do not have permission to modify folders",
            });
        }
        const folder = await getFolder(desktopId, folderId);
        if (!folder) {
            return reply.status(404).send({
                error: "Folder not found",
            });
        }
        const parsed = updateFolderSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Invalid request",
                details: parsed.error.flatten(),
            });
        }
        const { name, parentFolderId } = parsed.data;
        /*
         * Prevent moving a folder into itself.
         */
        if (parentFolderId === folderId) {
            return reply.status(400).send({
                error: "A folder cannot be its own parent",
            });
        }
        /*
         * Make sure the new parent belongs
         * to the same desktop.
         */
        if (parentFolderId) {
            const parent = await getFolder(desktopId, parentFolderId);
            if (!parent) {
                return reply.status(400).send({
                    error: "Parent folder not found",
                });
            }
        }
        const [updatedFolder] = await db
            .update(folders)
            .set({
            ...(name !== undefined && { name }),
            ...(parentFolderId !== undefined && {
                parentFolderId: parentFolderId ?? null,
            }),
            updatedAt: new Date(),
        })
            .where(and(eq(folders.id, folderId), eq(folders.desktopId, desktopId)))
            .returning();
        if (updatedFolder) {
            broadcastToDesktop(desktopId, {
                type: "folder.updated",
                folder: updatedFolder,
            });
        }
        return {
            folder: updatedFolder,
        };
    });
    /*
     * DELETE /desktops/:desktopId/folders/:folderId
     *
     * Delete a folder and everything inside it.
     */
    app.delete("/:desktopId/folders/:folderId", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        const { desktopId, folderId } = request.params;
        const membership = await getMembership(desktopId, request.user.id);
        if (!membership) {
            return reply.status(404).send({
                error: "Desktop not found",
            });
        }
        if (membership.role !== "owner" && membership.role !== "editor") {
            return reply.status(403).send({
                error: "You do not have permission to delete folders",
            });
        }
        const folder = await getFolder(desktopId, folderId);
        if (!folder) {
            return reply.status(404).send({
                error: "Folder not found",
            });
        }
        /*
         * Find the selected folder and every nested folder.
         */
        const folderIds = await getDescendantFolderIds(desktopId, folderId);
        /*
         * Find every file inside those folders.
         */
        const filesToDelete = await db
            .select({
            id: files.id,
            folderId: files.folderId,
            storageKey: files.storageKey,
        })
            .from(files)
            .where(eq(files.desktopId, desktopId));
        const matchingFiles = filesToDelete.filter((file) => file.folderId !== null && folderIds.includes(file.folderId));
        /*
         * Delete all corresponding objects from R2 first.
         */
        try {
            for (const file of matchingFiles) {
                await r2.send(new DeleteObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: file.storageKey,
                }));
            }
        }
        catch (error) {
            console.error("R2 folder deletion failed:", error);
            return reply.status(500).send({
                error: "Failed to delete folder contents from storage",
            });
        }
        /*
         * Delete the top-level folder.
         *
         * PostgreSQL ON DELETE CASCADE will automatically
         * delete the child folders and database file records.
         */
        try {
            await db
                .delete(folders)
                .where(and(eq(folders.id, folderId), eq(folders.desktopId, desktopId)));
        }
        catch (error) {
            console.error("Database folder deletion failed:", error);
            return reply.status(500).send({
                error: "Failed to delete folder",
            });
        }
        /*
         * Only broadcast after the database deletion succeeds.
         *
         * The folder.deleted event tells clients to remove
         * the deleted folder.
         *
         * The file.deleted events tell clients to remove
         * files that were deleted through the cascade.
         */
        broadcastToDesktop(desktopId, {
            type: "folder.deleted",
            folderId,
        });
        for (const file of matchingFiles) {
            broadcastToDesktop(desktopId, {
                type: "file.deleted",
                fileId: file.id,
            });
        }
        return {
            success: true,
        };
    });
}
