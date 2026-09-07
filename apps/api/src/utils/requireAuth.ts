import type { FastifyReply, FastifyRequest } from "fastify"

export function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  if (!request.user) {
    reply.status(401).send({
      error: "Not authenticated",
    })

    return null
  }

  return request.user
}
