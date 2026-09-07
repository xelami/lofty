import { z } from "zod";
export const createDesktopSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Desktop name is required")
        .max(100, "Desktop name is too long"),
});
const desktopSettingsSchema = z.object({
    theme: z
        .object({
        backgroundColor: z.string().optional(),
        accentColor: z.string().optional(),
        windowStyle: z.enum(["classic", "glass", "flat", "retro"]).optional(),
        windowOpacity: z.number().min(0).max(1).optional(),
        taskbarStyle: z.enum(["classic", "floating", "minimal"]).optional(),
        taskbarPosition: z.enum(["bottom", "top"]).optional(),
        iconStyle: z.enum(["classic", "minimal", "pixel"]).optional(),
        font: z.enum(["system", "mono", "pixel"]).optional(),
    })
        .optional(),
    layout: z
        .object({
        iconSize: z.enum(["small", "medium", "large"]).optional(),
        iconSpacing: z.enum(["compact", "comfortable", "wide"]).optional(),
        iconLabelPosition: z.enum(["below", "right"]).optional(),
        showTaskbar: z.boolean().optional(),
        showClock: z.boolean().optional(),
        showCollaborators: z.boolean().optional(),
    })
        .optional(),
});
export const renameSchema = z.object({
    name: z.string().trim().min(1).max(255),
});
export const updateDesktopSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Desktop name is required")
        .max(100, "Desktop name is too long")
        .optional(),
    wallpaper: z.string().url().nullable().optional(),
    settings: desktopSettingsSchema.optional(),
});
//# sourceMappingURL=desktops.js.map