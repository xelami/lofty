import { Google } from "arctic"

const clientId = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET
const redirectUri = process.env.GOOGLE_REDIRECT_URI

if (!clientId) {
  throw new Error("Missing GOOGLE_CLIENT_ID")
}

if (!clientSecret) {
  throw new Error("Missing GOOGLE_CLIENT_SECRET")
}

if (!redirectUri) {
  throw new Error("Missing GOOGLE_REDIRECT_URI")
}

export const google = new Google(clientId, clientSecret, redirectUri)

export const googleLink = new Google(
  clientId,
  clientSecret,
  process.env.GOOGLE_LINK_REDIRECT_URI ??
    "http://localhost:3001/auth/link/google/callback",
)
