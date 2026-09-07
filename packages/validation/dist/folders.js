import { z } from "zod";
export const createFolderSchema = z.object({
    name: z.string().trim().min(1).max(255),
    parentFolderId: z.string().uuid().nullable().optional(),
});
export const updateFolderSchema = z.object({
    name: z.string().trim().min(1).max(255).optional(),
    parentFolderId: z.string().uuid().nullable().optional(),
});
//# sourceMappingURL=folders.js.map