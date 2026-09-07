import "dotenv/config";
import authPlugin from "./plugins/auth.js";
import { fileRoutes } from "./routes/files.js";
import { memberRoutes } from "./routes/members.js";
import { oauthRoutes } from "./routes/oauth.js";
import { profileRoutes } from "./routes/profiles.js";
const { default: Fastify } = await import("fastify");
const { default: cors } = await import("@fastify/cors");
const { default: cookie } = await import("@fastify/cookie");
const { authRoutes } = await import("./routes/auth.js");
const { desktopRoutes } = await import("./routes/desktops.js");
const { folderRoutes } = await import("./routes/folders.js");
const { realtimeRoutes } = await import("./routes/realtime.js");
const app = Fastify({
    logger: true,
});
await app.register(cors, {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
});
await app.register(cookie);
await app.register(authPlugin);
await app.register(authRoutes, {
    prefix: "/api/v1/auth",
});
await app.register(oauthRoutes, {
    prefix: "/api/v1/auth",
});
await app.register(profileRoutes, {
    prefix: "/api/v1/profiles",
});
await app.register(desktopRoutes, {
    prefix: "/api/v1/desktops",
});
await app.register(folderRoutes, {
    prefix: "/api/v1/desktops",
});
await app.register(fileRoutes, {
    prefix: "/api/v1/desktops",
});
await app.register(memberRoutes, {
    prefix: "/api/v1/desktops",
});
await app.register(realtimeRoutes, {
    prefix: "/api/v1/desktops",
});
app.get("/api/v1/health", async () => {
    return {
        status: "ok",
        service: "lofty-api",
    };
});
const port = Number(process.env.PORT) || 3001;
try {
    await app.listen({
        port,
        host: "0.0.0.0",
    });
}
catch (error) {
    app.log.error(error);
    process.exit(1);
}
