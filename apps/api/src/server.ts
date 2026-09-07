import "dotenv/config"
import authPlugin from "./plugins/auth.js"
import { fileRoutes } from "./routes/files.js"
import { memberRoutes } from "./routes/members.js"
import { oauthRoutes } from "./routes/oauth.js"
import { profileRoutes } from "./routes/profiles.js"

const { default: Fastify } = await import("fastify")
const { default: cors } = await import("@fastify/cors")
const { default: cookie } = await import("@fastify/cookie")
const { authRoutes } = await import("./routes/auth.js")
const { desktopRoutes } = await import("./routes/desktops.js")
const { folderRoutes } = await import("./routes/folders.js")
const { realtimeRoutes } = await import("./routes/realtime.js")

const app = Fastify({
  logger: true,
})

const allowedOrigins = ["http://localhost:5173", "https://lofty.social"]

await app.register(cors, {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
})

await app.register(cookie)

await app.register(authPlugin)

const API_PREFIX = process.env.API_PREFIX || "/api/v1"

await app.register(authRoutes, {
  prefix: `${API_PREFIX}/auth`,
})

await app.register(oauthRoutes, {
  prefix: `${API_PREFIX}/auth`,
})

await app.register(profileRoutes, {
  prefix: `${API_PREFIX}/profiles`,
})

await app.register(desktopRoutes, {
  prefix: `${API_PREFIX}/desktops`,
})

await app.register(folderRoutes, {
  prefix: `${API_PREFIX}/desktops`,
})

await app.register(fileRoutes, {
  prefix: `${API_PREFIX}/desktops`,
})

await app.register(memberRoutes, {
  prefix: `${API_PREFIX}/desktops`,
})

await app.register(realtimeRoutes, {
  prefix: `${API_PREFIX}/desktops`,
})

app.get(`${API_PREFIX}/health`, async () => {
  return {
    status: "ok",
    service: "lofty-api",
  }
})

const port = Number(process.env.PORT) || 3001

try {
  await app.listen({
    port,
    host: "0.0.0.0",
  })
} catch (error) {
  app.log.error(error)
  process.exit(1)
}
