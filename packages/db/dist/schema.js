import { pgTable, uuid, varchar, text, timestamp, bigint, pgEnum, primaryKey, index, jsonb, unique, real, } from "drizzle-orm/pg-core";
export const DEFAULT_DESKTOP_SETTINGS = {
    theme: {
        backgroundColor: "#245edb",
        accentColor: "#ffffff",
        windowStyle: "classic",
        windowOpacity: 0.95,
        taskbarStyle: "classic",
        taskbarPosition: "bottom",
        iconStyle: "classic",
        font: "system",
    },
    layout: {
        iconSize: "medium",
        iconSpacing: "wide",
        iconLabelPosition: "below",
        showTaskbar: true,
        showClock: true,
        showCollaborators: true,
    },
};
export const authProviderEnum = pgEnum("auth_provider", ["google"]);
export const desktopRoleEnum = pgEnum("desktop_role", [
    "owner",
    "editor",
    "viewer",
]);
export const users = pgTable("users", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", {
        length: 255,
    }),
    passwordHash: text("password_hash"),
    name: varchar("name", {
        length: 100,
    }),
    emailVerifiedAt: timestamp("email_verified_at", {
        withTimezone: true,
    }),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
}, (table) => [unique("users_email_unique").on(table.email)]);
export const emailVerificationTokens = pgTable("email_verification_tokens", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
        onDelete: "cascade",
    }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", {
        withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
}, (table) => [
    unique("email_verification_tokens_hash_unique").on(table.tokenHash),
    index("email_verification_tokens_user_id_idx").on(table.userId),
]);
export const passwordChangeTokens = pgTable("password_change_tokens", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
        onDelete: "cascade",
    }),
    tokenHash: text("token_hash").notNull(),
    newPasswordHash: text("new_password_hash").notNull(),
    expiresAt: timestamp("expires_at", {
        withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
}, (table) => [
    unique("password_change_tokens_hash_unique").on(table.tokenHash),
    index("password_change_tokens_user_id_idx").on(table.userId),
]);
export const accounts = pgTable("accounts", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
        onDelete: "cascade",
    }),
    provider: authProviderEnum("provider").notNull(),
    providerAccountId: varchar("provider_account_id", {
        length: 255,
    }).notNull(),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
}, (table) => [
    unique("accounts_provider_account_unique").on(table.provider, table.providerAccountId),
    index("accounts_user_id_idx").on(table.userId),
]);
export const sessions = pgTable("sessions", {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
        onDelete: "cascade",
    }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", {
        withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
}, (table) => [
    unique("sessions_token_hash_unique").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
]);
export const oauthLinkStates = pgTable("oauth_link_states", {
    id: uuid("id").defaultRandom().primaryKey(),
    state: text("state").notNull().unique(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
        onDelete: "cascade",
    }),
    provider: text("provider").notNull(),
    codeVerifier: text("code_verifier").notNull(),
    expiresAt: timestamp("expires_at", {
        withTimezone: true,
    }).notNull(),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
});
export const desktops = pgTable("desktops", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", {
        length: 100,
    }).notNull(),
    ownerId: uuid("owner_id")
        .notNull()
        .references(() => users.id, { onDelete: "restrict" }),
    wallpaper: text("wallpaper"),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
    settings: jsonb("settings")
        .$type()
        .notNull()
        .default(DEFAULT_DESKTOP_SETTINGS),
}, (table) => [index("desktops_owner_id_idx").on(table.ownerId)]);
export const desktopMembers = pgTable("desktop_members", {
    desktopId: uuid("desktop_id")
        .notNull()
        .references(() => desktops.id, {
        onDelete: "cascade",
    }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, {
        onDelete: "cascade",
    }),
    role: desktopRoleEnum("role").notNull(),
    joinedAt: timestamp("joined_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
}, (table) => [
    primaryKey({
        columns: [table.desktopId, table.userId],
    }),
    index("desktop_members_user_id_idx").on(table.userId),
]);
export const folders = pgTable("folders", {
    id: uuid("id").defaultRandom().primaryKey(),
    desktopId: uuid("desktop_id")
        .notNull()
        .references(() => desktops.id, {
        onDelete: "cascade",
    }),
    parentFolderId: uuid("parent_folder_id").references(() => folders.id, {
        onDelete: "cascade",
    }),
    name: varchar("name", {
        length: 255,
    }).notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
        onDelete: "set null",
    }),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
}, (table) => [
    index("folders_desktop_id_idx").on(table.desktopId),
    index("folders_parent_folder_id_idx").on(table.parentFolderId),
]);
export const files = pgTable("files", {
    id: uuid("id").defaultRandom().primaryKey(),
    desktopId: uuid("desktop_id")
        .notNull()
        .references(() => desktops.id, {
        onDelete: "cascade",
    }),
    folderId: uuid("folder_id").references(() => folders.id, {
        onDelete: "cascade",
    }),
    name: varchar("name", {
        length: 255,
    }).notNull(),
    storageKey: text("storage_key").notNull().unique(),
    mimeType: varchar("mime_type", {
        length: 255,
    }).notNull(),
    size: bigint("size", {
        mode: "number",
    }).notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
        onDelete: "set null",
    }),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
}, (table) => [
    index("files_desktop_id_idx").on(table.desktopId),
    index("files_folder_id_idx").on(table.folderId),
]);
export const desktopItems = pgTable("desktop_items", {
    id: uuid("id").defaultRandom().primaryKey(),
    desktopId: uuid("desktop_id")
        .notNull()
        .references(() => desktops.id, {
        onDelete: "cascade",
    }),
    folderId: uuid("folder_id").references(() => folders.id, {
        onDelete: "cascade",
    }),
    fileId: uuid("file_id").references(() => files.id, {
        onDelete: "cascade",
    }),
    x: real("x").notNull().default(24),
    y: real("y").notNull().default(24),
    createdAt: timestamp("created_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", {
        withTimezone: true,
    })
        .defaultNow()
        .notNull(),
}, (table) => [
    index("desktop_items_desktop_id_idx").on(table.desktopId),
    index("desktop_items_folder_id_idx").on(table.folderId),
    index("desktop_items_file_id_idx").on(table.fileId),
    unique("desktop_items_folder_unique").on(table.folderId),
    unique("desktop_items_file_unique").on(table.fileId),
]);
