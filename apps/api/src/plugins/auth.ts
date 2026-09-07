import fp from "fastify-plugin"
import type { FastifyInstance, FastifyRequest } from "fastify"

import { getUserFromSession } from "../services/auth.js"

declare module "fastify" {
  interface FastifyRequest {
    user: {
      id: string
      name: string | null
      email: string | null
      passwordHash: string | null
      createdAt: Date
    } | null
  }
}

async function authPlugin(app: FastifyInstance) {
  app.decorateRequest("user", null)

  app.addHook("preHandler", async (request: FastifyRequest) => {
    const token = request.cookies.lofty_session

    if (!token) {
      request.user = null
      return
    }

    request.user = await getUserFromSession(token)
  })
}

export default fp(authPlugin)
