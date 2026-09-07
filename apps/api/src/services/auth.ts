import crypto from "node:crypto"
import argon2 from "argon2"

import { db } from "@lofty/db"
import { users, sessions } from "@lofty/db/schema"

import { and, eq, isNotNull } from "drizzle-orm"

const SESSION_DURATION = 60 * 60 * 24 * 30

export async function hashPassword(password: string) {
  return argon2.hash(password, {
    type: argon2.argon2id,
  })
}

export async function verifyPassword(password: string, passwordHash: string) {
  return argon2.verify(passwordHash, password)
}

export function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex")
}

export function hashSessionToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function generateEmailVerificationToken() {
  return crypto.randomBytes(32).toString("hex")
}

export function hashEmailVerificationToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function createSession(userId: string) {
  const token = generateSessionToken()
  const tokenHash = hashSessionToken(token)

  const expiresAt = new Date(Date.now() + SESSION_DURATION * 1000)

  await db.insert(sessions).values({
    userId,
    tokenHash,
    expiresAt,
  })

  return {
    token,
    expiresAt,
  }
}

export async function getUserFromSession(token: string) {
  const tokenHash = hashSessionToken(token)

  const result = await db
    .select({
      user: users,
      session: sessions,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(eq(sessions.tokenHash, tokenHash), isNotNull(users.emailVerifiedAt)),
    )
    .limit(1)

  const record = result[0]

  if (!record) {
    return null
  }

  if (record.session.expiresAt <= new Date()) {
    await db.delete(sessions).where(eq(sessions.id, record.session.id))

    return null
  }

  return record.user
}

export async function deleteSession(token: string) {
  const tokenHash = hashSessionToken(token)
  await db.delete(sessions).where(eq(sessions.tokenHash, tokenHash))
}

export function generatePasswordChangeToken() {
  return crypto.randomBytes(32).toString("hex")
}

export function hashPasswordChangeToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex")
}
