export function requireAuth(request, reply) {
    if (!request.user) {
        reply.status(401).send({
            error: "Not authenticated",
        });
        return null;
    }
    return request.user;
}
