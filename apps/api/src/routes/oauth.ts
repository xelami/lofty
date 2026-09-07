import type { FastifyInstance, FastifyPluginAsync } from "fastify"
import { generateCodeVerifier, generateState } from "arctic"
import { google } from "../oauth/google.js"
import { createSession } from "../services/auth.js"
import { resolveOAuthLogin } from "../oauth.js"

export async function oauthRoutes(app: FastifyInstance) {
  app.get("/google", async (request, reply) => {
    const state = generateState()
    const codeVerifier = generateCodeVerifier()

    const url = google.createAuthorizationURL(state, codeVerifier, [
      "openid",
      "email",
      "profile",
    ])

    reply.setCookie("google_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // domain: ".eigobit.com",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 10,
    })

    reply.setCookie("google_oauth_code_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      // domain: ".eigobit.com",
      path: "/",
      maxAge: 60 * 10,
    })

    return reply.redirect(url.toString())
  })

  app.get("/google/callback", async (request, reply) => {
    const { code, state } = request.query as {
      code?: string
      state?: string
    }

    const storedState = request.cookies.google_oauth_state

    const codeVerifier = request.cookies.google_oauth_code_verifier

    if (!code || !state || !storedState || !codeVerifier) {
      return reply.code(400).send({
        error: "Invalid OAuth request",
      })
    }

    if (state !== storedState) {
      return reply.code(400).send({
        error: "Invalid OAuth state",
      })
    }

    reply.clearCookie("google_oauth_state", {
      path: "/",
    })

    reply.clearCookie("google_oauth_code_verifier", {
      path: "/",
    })

    let tokens

    try {
      tokens = await google.validateAuthorizationCode(code, codeVerifier)
    } catch {
      return reply.code(400).send({
        error: "Failed to authenticate with Google",
      })
    }

    const accessToken = tokens.accessToken()

    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    if (!response.ok) {
      return reply.code(400).send({
        error: "Failed to retrieve Google profile",
      })
    }

    const profile = (await response.json()) as {
      sub: string
      email?: string
      email_verified?: boolean
      name?: string
    }

    if (!profile.sub) {
      return reply.code(400).send({
        error: "Google account has no valid ID",
      })
    }

    const result = await resolveOAuthLogin({
      provider: "google",
      providerAccountId: profile.sub,
      email: profile.email ?? null,
      emailVerified: profile.email_verified === true,
      name: profile.name ?? null,
    })

    if (result.status === "email_exists") {
      return reply.redirect(
        `${process.env.APP_URL}/login?error=oauth_account_exists`,
      )
    }

    const user = result.user
    const session = await createSession(user.id)

    reply.setCookie("lofty_session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      // domain: ".eigobit.com",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

    return reply.redirect(`${process.env.APP_URL}/desktops`)
  })
}
