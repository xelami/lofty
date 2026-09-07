import { z } from "zod";
export declare const createFolderSchema: z.ZodObject<{
    name: z.ZodString;
    parentFolderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
export declare const updateFolderSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    parentFolderId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$strip>;
//# sourceMappingURL=folders.d.ts.map