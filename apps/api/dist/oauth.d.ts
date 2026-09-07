export type OAuthProvider = "google";
export type OAuthProfile = {
    provider: OAuthProvider;
    providerAccountId: string;
    email: string | null;
    emailVerified: boolean;
    name: string | null;
};
export declare function findUserByOAuthAccount(provider: OAuthProvider, providerAccountId: string): Promise<{
    id: string;
    email: string | null;
    passwordHash: string | null;
    name: string | null;
    emailVerifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare function findUserByEmail(email: string): Promise<{
    id: string;
    email: string | null;
    passwordHash: string | null;
    name: string | null;
    emailVerifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare function linkOAuthAccount(userId: string, profile: OAuthProfile): Promise<void>;
export declare function createOAuthUser(profile: OAuthProfile): Promise<{
    createdAt: Date;
    email: string | null;
    emailVerifiedAt: Date | null;
    id: string;
    name: string | null;
    passwordHash: string | null;
    updatedAt: Date;
}>;
export declare function resolveOAuthLogin(profile: OAuthProfile): Promise<{
    user: {
        id: string;
        email: string | null;
        passwordHash: string | null;
        name: string | null;
        emailVerifiedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    };
    status: "existing";
} | {
    user: null;
    status: "email_exists";
} | {
    user: {
        createdAt: Date;
        email: string | null;
        emailVerifiedAt: Date | null;
        id: string;
        name: string | null;
        passwordHash: string | null;
        updatedAt: Date;
    };
    status: "created";
}>;
//# sourceMappingURL=oauth.d.ts.map