import { z } from "zod";
export declare const createFileSchema: z.ZodObject<{
    name: z.ZodString;
    mimeType: z.ZodString;
    size: z.ZodNumber;
    folderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
//# sourceMappingURL=files.d.ts.map