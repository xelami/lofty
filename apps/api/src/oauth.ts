import { eq, and } from "drizzle-orm"

import { db } from "@lofty/db"
import { accounts, users } from "@lofty/db/schema"

export type OAuthProvider = "google"

export type OAuthProfile = {
  provider: OAuthProvider
  providerAccountId: string
  email: string | null
  emailVerified: boolean
  name: string | null
}

export async function findUserByOAuthAccount(
  provider: OAuthProvider,
  providerAccountId: string,
) {
  const [result] = await db
    .select({
      user: users,
      account: accounts,
    })
    .from(accounts)
    .innerJoin(users, eq(accounts.userId, users.id))
    .where(
      and(
        eq(accounts.provider, provider),
        eq(accounts.providerAccountId, providerAccountId),
      ),
    )
    .limit(1)

  return result?.user ?? null
}

export async function findUserByEmail(email: string) {
  const normalizedEmail = email.toLowerCase()

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1)

  return user ?? null
}

export async function linkOAuthAccount(userId: string, profile: OAuthProfile) {
  const existingUser = await findUserByOAuthAccount(
    profile.provider,
    profile.providerAccountId,
  )

  if (existingUser) {
    if (existingUser.id === userId) {
      return
    }

    throw new Error("OAuth account is already linked to another user")
  }

  await db.insert(accounts).values({
    userId,
    provider: profile.provider,
    providerAccountId: profile.providerAccountId,
  })
}

export async function createOAuthUser(profile: OAuthProfile) {
  const [user] = await db
    .insert(users)
    .values({
      email:
        profile.emailVerified && profile.email
          ? profile.email.toLowerCase()
          : null,
      name: profile.name,
      emailVerifiedAt: profile.emailVerified ? new Date() : null,
    })
    .returning()

  if (!user) {
    throw new Error("Failed to create OAuth user")
  }

  await linkOAuthAccount(user.id, profile)

  return user
}

export async function resolveOAuthLogin(profile: OAuthProfile) {
  const existingOAuthUser = await findUserByOAuthAccount(
    profile.provider,
    profile.providerAccountId,
  )

  if (existingOAuthUser) {
    return {
      user: existingOAuthUser,
      status: "existing" as const,
    }
  }

  if (profile.email && profile.emailVerified) {
    const existingEmailUser = await findUserByEmail(profile.email)

    if (existingEmailUser) {
      return {
        user: null,
        status: "email_exists" as const,
      }
    }
  }

  const user = await createOAuthUser(profile)

  return {
    user,
    status: "created" as const,
  }
}
