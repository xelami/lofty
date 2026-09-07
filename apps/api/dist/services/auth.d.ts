export declare function hashPassword(password: string): Promise<string>;
export declare function verifyPassword(password: string, passwordHash: string): Promise<boolean>;
export declare function generateSessionToken(): string;
export declare function hashSessionToken(token: string): string;
export declare function generateEmailVerificationToken(): string;
export declare function hashEmailVerificationToken(token: string): string;
export declare function createSession(userId: string): Promise<{
    token: string;
    expiresAt: Date;
}>;
export declare function getUserFromSession(token: string): Promise<{
    id: string;
    email: string | null;
    passwordHash: string | null;
    name: string | null;
    emailVerifiedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
} | null>;
export declare function deleteSession(token: string): Promise<void>;
export declare function generatePasswordChangeToken(): string;
export declare function hashPasswordChangeToken(token: string): string;
//# sourceMappingURL=auth.d.ts.map