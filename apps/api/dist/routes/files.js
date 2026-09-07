import { db } from "@lofty/db";
import { desktopMembers, folders, files } from "@lofty/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { createFileSchema } from "@lofty/validation";
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET_NAME } from "../lib/r2.js";
import crypto from "node:crypto";
import { broadcastEvent } from "../realtime/events.js";
import { canEditFiles } from "../auth/permissions.js";
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
async function folderBelongsToDesktop(folderId, desktopId) {
    const result = await db
        .select({
        id: folders.id,
    })
        .from(folders)
        .where(and(eq(folders.id, folderId), eq(folders.desktopId, desktopId)))
        .limit(1);
    return result.length > 0;
}
export async function fileRoutes(app) {
    /*
     * GET /desktops/:desktopId/files
     *
     * List files in a folder.
     *
     * No folderId = root files.
     */
    app.get("/:desktopId/files", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        const { desktopId } = request.params;
        const { folderId } = request.query;
        const membership = await getMembership(desktopId, request.user.id);
        if (!membership) {
            return reply.status(404).send({
                error: "Desktop not found",
            });
        }
        const conditions = [eq(files.desktopId, desktopId)];
        if (folderId) {
            conditions.push(eq(files.folderId, folderId));
        }
        else {
            conditions.push(isNull(files.folderId));
        }
        const result = await db
            .select({
            id: files.id,
            desktopId: files.desktopId,
            folderId: files.folderId,
            name: files.name,
            mimeType: files.mimeType,
            size: files.size,
            createdBy: files.createdBy,
            createdAt: files.createdAt,
            updatedAt: files.updatedAt,
        })
            .from(files)
            .where(and(...conditions));
        return {
            files: result,
        };
    });
    /*
     * POST /desktops/:desktopId/files/upload-url
     *
     * Generate a presigned R2 upload URL.
     */
    app.post("/:desktopId/files/upload-url", async (request, reply) => {
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
        if (!canEditFiles(membership.role)) {
            return reply.status(403).send({
                error: "You do not have permission to upload files",
            });
        }
        const parsed = createFileSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Invalid request",
                details: parsed.error.flatten(),
            });
        }
        const { name, mimeType, size, folderId } = parsed.data;
        if (folderId) {
            const folderExists = await folderBelongsToDesktop(folderId, desktopId);
            if (!folderExists) {
                return reply.status(400).send({
                    error: "Folder not found",
                });
            }
        }
        const fileId = crypto.randomUUID();
        const storageKey = [desktopId, fileId, name].join("/");
        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: storageKey,
            ContentType: mimeType,
        });
        const uploadUrl = await getSignedUrl(r2, command, {
            expiresIn: 60 * 15,
        });
        return {
            fileId,
            storageKey,
            uploadUrl,
        };
    });
    /*
     * POST /desktops/:desktopId/files
     *
     * Confirm the R2 upload and create
     * the database metadata.
     */
    app.post("/:desktopId/files", async (request, reply) => {
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
        if (!canEditFiles(membership.role)) {
            return reply.status(403).send({
                error: "You do not have permission to upload files",
            });
        }
        const parsed = createFileSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Invalid request",
                details: parsed.error.flatten(),
            });
        }
        const { name, mimeType, size, folderId } = parsed.data;
        const body = request.body;
        if (!body.fileId) {
            return reply.status(400).send({
                error: "fileId is required",
            });
        }
        if (folderId) {
            const folderExists = await folderBelongsToDesktop(folderId, desktopId);
            if (!folderExists) {
                return reply.status(400).send({
                    error: "Folder not found",
                });
            }
        }
        const storageKey = [desktopId, body.fileId, name].join("/");
        const [file] = await db
            .insert(files)
            .values({
            id: body.fileId,
            desktopId,
            folderId: folderId ?? null,
            name,
            storageKey,
            mimeType,
            size,
            createdBy: request.user.id,
        })
            .returning();
        if (file) {
            broadcastEvent(desktopId, {
                type: "file.created",
                file: {
                    id: file.id,
                    desktopId: file.desktopId,
                    folderId: file.folderId,
                    name: file.name,
                    mimeType: file.mimeType,
                    size: file.size,
                    createdBy: file.createdBy,
                    createdAt: file.createdAt,
                    updatedAt: file.updatedAt,
                },
            });
        }
        return reply.status(201).send({
            file,
        });
    });
    /*
     * GET /desktops/:desktopId/files/:fileId/download-url
     *
     * Generate a presigned R2 download URL.
     */
    app.get("/:desktopId/files/:fileId/download-url", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        const { desktopId, fileId } = request.params;
        const { download } = request.query;
        const membership = await getMembership(desktopId, request.user.id);
        if (!membership) {
            return reply.status(404).send({
                error: "Desktop not found",
            });
        }
        const result = await db
            .select({
            storageKey: files.storageKey,
            name: files.name,
            mimeType: files.mimeType,
        })
            .from(files)
            .where(and(eq(files.id, fileId), eq(files.desktopId, desktopId)))
            .limit(1);
        const file = result[0];
        if (!file) {
            return reply.status(404).send({
                error: "File not found",
            });
        }
        const command = new GetObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: file.storageKey,
            ResponseContentType: file.mimeType,
            ResponseContentDisposition: download === "true"
                ? `attachment; filename="${file.name}"`
                : `inline; filename="${file.name}"`,
        });
        const downloadUrl = await getSignedUrl(r2, command, {
            expiresIn: 60 * 15,
        });
        return {
            downloadUrl,
        };
    });
    /*
     * PATCH /desktops/:desktopId/files/:fileId
     *
     * Rename / move a file.
     */
    app.patch("/:desktopId/files/:fileId", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        const { desktopId, fileId } = request.params;
        const membership = await getMembership(desktopId, request.user.id);
        if (!membership) {
            return reply.status(404).send({
                error: "Desktop not found",
            });
        }
        if (!canEditFiles(membership.role)) {
            return reply.status(403).send({
                error: "You do not have permission to modify files",
            });
        }
        const result = await db
            .select()
            .from(files)
            .where(and(eq(files.id, fileId), eq(files.desktopId, desktopId)))
            .limit(1);
        const file = result[0];
        if (!file) {
            return reply.status(404).send({
                error: "File not found",
            });
        }
        const body = request.body;
        if (body.name === undefined && body.folderId === undefined) {
            return reply.status(400).send({
                error: "Nothing to update",
            });
        }
        if (body.name !== undefined && !body.name.trim()) {
            return reply.status(400).send({
                error: "File name cannot be empty",
            });
        }
        if (body.folderId) {
            const folderExists = await folderBelongsToDesktop(body.folderId, desktopId);
            if (!folderExists) {
                return reply.status(400).send({
                    error: "Folder not found",
                });
            }
        }
        const [updatedFile] = await db
            .update(files)
            .set({
            ...(body.name !== undefined && {
                name: body.name.trim(),
            }),
            ...(body.folderId !== undefined && {
                folderId: body.folderId,
            }),
            updatedAt: new Date(),
        })
            .where(and(eq(files.id, fileId), eq(files.desktopId, desktopId)))
            .returning();
        if (updatedFile) {
            broadcastEvent(desktopId, {
                type: "file.updated",
                file: {
                    id: updatedFile.id,
                    desktopId: updatedFile.desktopId,
                    folderId: updatedFile.folderId,
                    name: updatedFile.name,
                    mimeType: updatedFile.mimeType,
                    size: updatedFile.size,
                    createdBy: updatedFile.createdBy,
                    createdAt: updatedFile.createdAt,
                    updatedAt: updatedFile.updatedAt,
                },
            });
        }
        return {
            file: updatedFile,
        };
    });
    /*
     * DELETE /desktops/:desktopId/files/:fileId
     */
    app.delete("/:desktopId/files/:fileId", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        const { desktopId, fileId } = request.params;
        const membership = await getMembership(desktopId, request.user.id);
        if (!membership) {
            return reply.status(404).send({
                error: "Desktop not found",
            });
        }
        if (!canEditFiles(membership.role)) {
            return reply.status(403).send({
                error: "You do not have permission to delete files",
            });
        }
        const result = await db
            .select({
            storageKey: files.storageKey,
        })
            .from(files)
            .where(and(eq(files.id, fileId), eq(files.desktopId, desktopId)))
            .limit(1);
        const file = result[0];
        if (!file) {
            return reply.status(404).send({
                error: "File not found",
            });
        }
        await r2.send(new DeleteObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: file.storageKey,
        }));
        await db
            .delete(files)
            .where(and(eq(files.id, fileId), eq(files.desktopId, desktopId)));
        broadcastEvent(desktopId, {
            type: "file.deleted",
            fileId,
        });
        return {
            success: true,
        };
    });
}
