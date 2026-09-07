import { z } from "zod";
export declare const createDesktopSchema: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
export declare const renameSchema: z.ZodObject<{
    name: z.ZodString;
}, z.core.$strip>;
export declare const updateDesktopSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    wallpaper: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    settings: z.ZodOptional<z.ZodObject<{
        theme: z.ZodOptional<z.ZodObject<{
            backgroundColor: z.ZodOptional<z.ZodString>;
            accentColor: z.ZodOptional<z.ZodString>;
            windowStyle: z.ZodOptional<z.ZodEnum<{
                classic: "classic";
                glass: "glass";
                flat: "flat";
                retro: "retro";
            }>>;
            windowOpacity: z.ZodOptional<z.ZodNumber>;
            taskbarStyle: z.ZodOptional<z.ZodEnum<{
                classic: "classic";
                floating: "floating";
                minimal: "minimal";
            }>>;
            taskbarPosition: z.ZodOptional<z.ZodEnum<{
                bottom: "bottom";
                top: "top";
            }>>;
            iconStyle: z.ZodOptional<z.ZodEnum<{
                classic: "classic";
                minimal: "minimal";
                pixel: "pixel";
            }>>;
            font: z.ZodOptional<z.ZodEnum<{
                pixel: "pixel";
                system: "system";
                mono: "mono";
            }>>;
        }, z.core.$strip>>;
        layout: z.ZodOptional<z.ZodObject<{
            iconSize: z.ZodOptional<z.ZodEnum<{
                small: "small";
                medium: "medium";
                large: "large";
            }>>;
            iconSpacing: z.ZodOptional<z.ZodEnum<{
                compact: "compact";
                comfortable: "comfortable";
                wide: "wide";
            }>>;
            iconLabelPosition: z.ZodOptional<z.ZodEnum<{
                below: "below";
                right: "right";
            }>>;
            showTaskbar: z.ZodOptional<z.ZodBoolean>;
            showClock: z.ZodOptional<z.ZodBoolean>;
            showCollaborators: z.ZodOptional<z.ZodBoolean>;
        }, z.core.$strip>>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type CreateDesktopInput = z.infer<typeof createDesktopSchema>;
export type UpdateDesktopInput = z.infer<typeof updateDesktopSchema>;
//# sourceMappingURL=desktops.d.ts.map