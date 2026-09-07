import type { FastifyInstance } from "fastify";
declare module "fastify" {
    interface FastifyRequest {
        user: {
            id: string;
            name: string | null;
            email: string | null;
            passwordHash: string | null;
            createdAt: Date;
        } | null;
    }
}
declare function authPlugin(app: FastifyInstance): Promise<void>;
declare const _default: typeof authPlugin;
export default _default;
//# sourceMappingURL=auth.d.ts.map