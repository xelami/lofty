import { db } from "@lofty/db";
import { users, emailVerificationTokens, passwordChangeTokens, sessions, desktops, } from "@lofty/db/schema";
import { eq } from "drizzle-orm";
import { registerSchema, loginSchema } from "@lofty/validation";
import { hashPassword, verifyPassword, createSession, getUserFromSession, deleteSession, generateEmailVerificationToken, hashEmailVerificationToken, hashPasswordChangeToken, } from "../services/auth.js";
import { sendVerificationEmail } from "../services/email.js";
const COOKIE_NAME = "lofty_session";
function getSessionToken(request) {
    return request.cookies[COOKIE_NAME];
}
export async function authRoutes(app) {
    app.post("/register", async (request, reply) => {
        const parsed = registerSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Invalid request",
                details: parsed.error.flatten(),
            });
        }
        const { name, email, password } = parsed.data;
        const existingUser = await db
            .select({
            id: users.id,
        })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        if (existingUser.length > 0) {
            return reply.status(409).send({
                error: "An account with this email already exists",
            });
        }
        const passwordHash = await hashPassword(password);
        const [user] = await db
            .insert(users)
            .values({
            name,
            email,
            passwordHash,
        })
            .returning({
            id: users.id,
            name: users.name,
            email: users.email,
            createdAt: users.createdAt,
        });
        const token = generateEmailVerificationToken();
        const tokenHash = hashEmailVerificationToken(token);
        await db.insert(emailVerificationTokens).values({
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
        });
        await sendVerificationEmail({
            email,
            name,
            token,
        });
        return reply.status(201).send({
            message: "Account created. Please verify your email.",
            user,
        });
    });
    app.get("/verify-email", async (request, reply) => {
        const { token } = request.query;
        if (!token) {
            return reply.status(400).send({
                error: "Verification token is required",
            });
        }
        const tokenHash = hashEmailVerificationToken(token);
        const result = await db
            .select({
            tokenId: emailVerificationTokens.id,
            userId: users.id,
            name: users.name,
            email: users.email,
            createdAt: users.createdAt,
            expiresAt: emailVerificationTokens.expiresAt,
            emailVerifiedAt: users.emailVerifiedAt,
        })
            .from(emailVerificationTokens)
            .innerJoin(users, eq(emailVerificationTokens.userId, users.id))
            .where(eq(emailVerificationTokens.tokenHash, tokenHash))
            .limit(1);
        const verification = result[0];
        if (!verification) {
            return reply.status(400).send({
                error: "Invalid or expired verification link",
            });
        }
        if (verification.expiresAt <= new Date()) {
            await db
                .delete(emailVerificationTokens)
                .where(eq(emailVerificationTokens.id, verification.tokenId));
            return reply.status(400).send({
                error: "This verification link has expired",
            });
        }
        // Account is already verified.
        // This can happen if the user clicks the same link twice.
        if (verification.emailVerifiedAt) {
            await db
                .delete(emailVerificationTokens)
                .where(eq(emailVerificationTokens.id, verification.tokenId));
            const session = await createSession(verification.userId);
            reply.setCookie(COOKIE_NAME, session.token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                expires: session.expiresAt,
            });
            return {
                message: "Email already verified",
                user: {
                    id: verification.userId,
                    name: verification.name,
                    email: verification.email,
                    createdAt: verification.createdAt,
                },
            };
        }
        // Verify the user's email.
        await db
            .update(users)
            .set({
            emailVerifiedAt: new Date(),
        })
            .where(eq(users.id, verification.userId));
        // Make the verification token single-use.
        await db
            .delete(emailVerificationTokens)
            .where(eq(emailVerificationTokens.id, verification.tokenId));
        // Automatically log the user in.
        const session = await createSession(verification.userId);
        reply.setCookie(COOKIE_NAME, session.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            expires: session.expiresAt,
        });
        return {
            message: "Email verified successfully",
            user: {
                id: verification.userId,
                name: verification.name,
                email: verification.email,
                createdAt: verification.createdAt,
            },
        };
    });
    app.post("/login", async (request, reply) => {
        const parsed = loginSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Invalid request",
                details: parsed.error.flatten(),
            });
        }
        const { email, password } = parsed.data;
        const result = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        const user = result[0];
        if (!user) {
            return reply.status(401).send({
                error: "Invalid email or password",
            });
        }
        const passwordValid = await verifyPassword(password, user.passwordHash);
        if (!passwordValid) {
            return reply.status(401).send({
                error: "Invalid email or password",
            });
        }
        if (!user.emailVerifiedAt) {
            return reply.status(403).send({
                error: "Please verify your email before signing in",
            });
        }
        const session = await createSession(user.id);
        reply.setCookie(COOKIE_NAME, session.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            expires: session.expiresAt,
        });
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
            },
        };
    });
    app.post("/logout", async (request, reply) => {
        const token = getSessionToken(request);
        if (token) {
            await deleteSession(token);
        }
        reply.clearCookie(COOKIE_NAME, {
            path: "/",
        });
        return {
            success: true,
        };
    });
    app.get("/me", async (request, reply) => {
        const token = getSessionToken(request);
        if (!token) {
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        const user = await getUserFromSession(token);
        if (!user) {
            reply.clearCookie(COOKIE_NAME, {
                path: "/",
            });
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        return {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt,
                hasPassword: user.passwordHash !== null,
            },
        };
    });
    app.post("/confirm-password-change", async (request, reply) => {
        console.log("🔥🔥🔥 CONFIRM ROUTE HIT 🔥🔥🔥");
        console.log("BODY:", request.body);
        const { token } = request.body;
        if (!token) {
            console.log("❌ NO TOKEN");
            return reply.status(400).send({
                error: "Password change token is required",
            });
        }
        const tokenHash = hashPasswordChangeToken(token);
        console.log("TOKEN HASH GENERATED");
        const result = await db
            .select({
            tokenId: passwordChangeTokens.id,
            userId: passwordChangeTokens.userId,
            newPasswordHash: passwordChangeTokens.newPasswordHash,
            expiresAt: passwordChangeTokens.expiresAt,
        })
            .from(passwordChangeTokens)
            .where(eq(passwordChangeTokens.tokenHash, tokenHash))
            .limit(1);
        const passwordChange = result[0];
        console.log("PENDING PASSWORD CHANGE:", passwordChange
            ? {
                tokenId: passwordChange.tokenId,
                userId: passwordChange.userId,
                expiresAt: passwordChange.expiresAt,
            }
            : null);
        if (!passwordChange) {
            return reply.status(400).send({
                error: "Invalid or expired password change link",
            });
        }
        if (passwordChange.expiresAt <= new Date()) {
            await db
                .delete(passwordChangeTokens)
                .where(eq(passwordChangeTokens.id, passwordChange.tokenId));
            return reply.status(400).send({
                error: "This password change link has expired",
            });
        }
        const [updatedUser] = await db
            .update(users)
            .set({
            passwordHash: passwordChange.newPasswordHash,
            updatedAt: new Date(),
        })
            .where(eq(users.id, passwordChange.userId))
            .returning({
            id: users.id,
        });
        console.log("USER PASSWORD UPDATED:", updatedUser?.id ?? null);
        if (!updatedUser) {
            return reply.status(500).send({
                error: "Failed to update password",
            });
        }
        await db
            .delete(passwordChangeTokens)
            .where(eq(passwordChangeTokens.id, passwordChange.tokenId));
        await db.delete(sessions).where(eq(sessions.userId, passwordChange.userId));
        console.log("🔥 PASSWORD CHANGE COMPLETE 🔥");
        return {
            success: true,
            message: "Password changed successfully",
        };
    });
    app.delete("/account", async (request, reply) => {
        const token = getSessionToken(request);
        if (!token) {
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        const user = await getUserFromSession(token);
        if (!user) {
            reply.clearCookie(COOKIE_NAME, {
                path: "/",
            });
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        /*
         * A user cannot delete their account while they
         * still own any desktops.
         */
        const ownedDesktops = await db
            .select({
            id: desktops.id,
            name: desktops.name,
        })
            .from(desktops)
            .where(eq(desktops.ownerId, user.id));
        if (ownedDesktops.length > 0) {
            return reply.status(409).send({
                error: "You must transfer or delete all desktops you own before deleting your account",
                code: "ACCOUNT_OWNS_DESKTOPS",
                desktops: ownedDesktops,
            });
        }
        /*
         * Delete the account.
         *
         * Most user-owned records have ON DELETE CASCADE.
         * Files/folders created by the user use ON DELETE SET NULL
         * so collaborative content is preserved.
         */
        await db.delete(users).where(eq(users.id, user.id));
        reply.clearCookie(COOKIE_NAME, {
            path: "/",
        });
        return {
            success: true,
        };
    });
}
