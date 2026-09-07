import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { eq } from "drizzle-orm"

import { db } from "@lofty/db"
import {
  users,
  emailVerificationTokens,
  sessions,
  passwordChangeTokens,
} from "@lofty/db/schema"

import {
  generateEmailVerificationToken,
  hashEmailVerificationToken,
  hashSessionToken,
  hashPassword,
  verifyPassword,
  generatePasswordChangeToken,
  hashPasswordChangeToken,
} from "../services/auth.js"
import {
  sendPasswordChangeEmail,
  sendVerificationEmail,
} from "../services/email.js"

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    email: z.string().trim().email().max(255).optional(),
  })
  .refine((data) => data.name !== undefined || data.email !== undefined, {
    message: "At least one field must be provided",
  })

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  })

const EMAIL_VERIFICATION_DURATION = 60 * 60 * 24

export async function profileRoutes(app: FastifyInstance) {
  app.patch("/", async (request, reply) => {
    const token = request.cookies.lofty_session

    if (!token) {
      return reply.status(401).send({
        error: "Not authenticated",
      })
    }

    const tokenHash = hashSessionToken(token)

    const sessionResult = await db
      .select({
        user: users,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1)

    const user = sessionResult[0]?.user

    if (!user) {
      return reply.status(401).send({
        error: "Not authenticated",
      })
    }

    if (user.emailVerifiedAt === null) {
      return reply.status(403).send({
        error: "Email address must be verified",
      })
    }

    if (user.passwordHash === null) {
      return reply.status(403).send({
        error: "OAuth accounts cannot update their profile",
      })
    }

    const parsed = updateProfileSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        error: parsed.error.issues[0]?.message ?? "Invalid profile data",
      })
    }

    const { name, email } = parsed.data

    const normalizedEmail = email?.toLowerCase()

    if (normalizedEmail && normalizedEmail !== user.email) {
      const existingUser = await db
        .select({
          id: users.id,
        })
        .from(users)
        .where(eq(users.email, normalizedEmail))
        .limit(1)

      if (existingUser[0]) {
        return reply.status(409).send({
          error: "An account with that email address already exists",
        })
      }
    }

    const emailChanged =
      normalizedEmail !== undefined && normalizedEmail !== user.email

    const updateData: {
      name?: string
      email?: string
      emailVerifiedAt?: Date | null
    } = {}

    if (name !== undefined && name !== user.name) {
      updateData.name = name
    }

    if (emailChanged && normalizedEmail) {
      updateData.email = normalizedEmail
      updateData.emailVerifiedAt = null
    }

    if (Object.keys(updateData).length === 0) {
      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          hasPassword: user.passwordHash !== null,
          createdAt: user.createdAt,
        },
        emailVerificationRequired: false,
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, user.id))
      .returning()

    if (!updatedUser) {
      return reply.status(500).send({
        error: "Failed to update profile",
      })
    }

    if (emailChanged && normalizedEmail) {
      const verificationToken = generateEmailVerificationToken()
      const verificationTokenHash =
        hashEmailVerificationToken(verificationToken)

      const expiresAt = new Date(
        Date.now() + EMAIL_VERIFICATION_DURATION * 1000,
      )

      await db.insert(emailVerificationTokens).values({
        userId: user.id,
        tokenHash: verificationTokenHash,
        expiresAt,
      })

      await sendVerificationEmail({
        email: normalizedEmail,
        name: updatedUser.name!,
        token: verificationToken,
      })

      return {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          hasPassword: updatedUser.passwordHash !== null,
          createdAt: updatedUser.createdAt,
        },
        emailVerificationRequired: true,
      }
    }

    return {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        hasPassword: updatedUser.passwordHash !== null,
        createdAt: updatedUser.createdAt,
      },
      emailVerificationRequired: false,
    }
  })

  app.post("/change-password", async (request, reply) => {
    const token = request.cookies.lofty_session

    if (!token) {
      return reply.status(401).send({
        error: "Not authenticated",
      })
    }

    const tokenHash = hashSessionToken(token)

    const sessionResult = await db
      .select({
        user: users,
      })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(eq(sessions.tokenHash, tokenHash))
      .limit(1)

    const user = sessionResult[0]?.user

    if (!user) {
      return reply.status(401).send({
        error: "Not authenticated",
      })
    }

    if (user.emailVerifiedAt === null) {
      return reply.status(403).send({
        error: "Email address must be verified",
      })
    }

    if (user.passwordHash === null) {
      return reply.status(403).send({
        error: "OAuth accounts do not have a password",
      })
    }

    const parsed = changePasswordSchema.safeParse(request.body)

    if (!parsed.success) {
      return reply.status(400).send({
        error: parsed.error.issues[0]?.message ?? "Invalid password data",
      })
    }

    const { currentPassword, newPassword } = parsed.data

    const currentPasswordValid = await verifyPassword(
      currentPassword,
      user.passwordHash,
    )

    if (!currentPasswordValid) {
      return reply.status(401).send({
        error: "Current password is incorrect",
      })
    }

    if (currentPassword === newPassword) {
      return reply.status(400).send({
        error: "New password must be different from your current password",
      })
    }

    // Invalidate any previous pending password change.
    await db
      .delete(passwordChangeTokens)
      .where(eq(passwordChangeTokens.userId, user.id))

    // Hash the proposed password now.
    // The plaintext password is never stored in the database.
    const newPasswordHash = await hashPassword(newPassword)

    const confirmationToken = generatePasswordChangeToken()
    const confirmationTokenHash = hashPasswordChangeToken(confirmationToken)

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await db.insert(passwordChangeTokens).values({
      userId: user.id,
      tokenHash: confirmationTokenHash,
      newPasswordHash,
      expiresAt,
    })

    await sendPasswordChangeEmail({
      email: user.email!,
      name: user.name!,
      token: confirmationToken,
    })

    return {
      success: true,
      confirmationRequired: true,
    }
  })
}
