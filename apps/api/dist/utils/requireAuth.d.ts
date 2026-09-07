import type { FastifyReply, FastifyRequest } from "fastify";
export declare function requireAuth(request: FastifyRequest, reply: FastifyReply): {
    id: string;
    name: string | null;
    email: string | null;
    passwordHash: string | null;
    createdAt: Date;
} | null;
//# sourceMappingURL=requireAuth.d.ts.map