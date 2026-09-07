import { z } from "zod"

export const createFileSchema = z.object({
  name: z.string().trim().min(1).max(255),

  mimeType: z.string().trim().min(1).max(255),

  size: z
    .number()
    .int()
    .positive()
    .max(5 * 1024 * 1024 * 1024),

  folderId: z.string().uuid().nullable().optional(),
})
