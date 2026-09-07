import fp from "fastify-plugin";
import { getUserFromSession } from "../services/auth.js";
async function authPlugin(app) {
    app.decorateRequest("user", null);
    app.addHook("preHandler", async (request) => {
        const token = request.cookies.lofty_session;
        if (!token) {
            request.user = null;
            return;
        }
        request.user = await getUserFromSession(token);
    });
}
export default fp(authPlugin);
