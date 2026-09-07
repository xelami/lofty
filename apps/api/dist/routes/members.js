import { db } from "@lofty/db";
import { users, desktops, desktopMembers } from "@lofty/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { canManageMembers } from "../auth/permissions.js";
import { sendDesktopInvitation } from "../services/email.js";
const addMemberSchema = z.object({
    email: z.string().email(),
    role: z.enum(["editor", "viewer"]).default("viewer"),
});
const updateMemberSchema = z.object({
    role: z.enum(["editor", "viewer"]),
});
async function getMembership(desktopId, userId) {
    const result = await db
        .select({
        role: desktopMembers.role,
    })
        .from(desktopMembers)
        .where(and(eq(desktopMembers.desktopId, desktopId), eq(desktopMembers.userId, userId)))
        .limit(1);
    return result[0];
}
async function requireOwner(desktopId, userId, reply) {
    const membership = await getMembership(desktopId, userId);
    if (!membership) {
        reply.status(404).send({
            error: "Desktop not found",
        });
        return false;
    }
    if (!canManageMembers(membership.role)) {
        reply.status(403).send({
            error: "Only the desktop owner can manage members",
        });
        return false;
    }
    return true;
}
export async function memberRoutes(app) {
    /*
     * GET /desktops/:desktopId/members
     *
     * List all members of a desktop.
     */
    app.get("/:desktopId/members", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        const { desktopId } = request.params;
        const membership = await getMembership(desktopId, request.user.id);
        if (!membership) {
            return reply.status(404).send({
                error: "Desktop not found",
            });
        }
        const result = await db
            .select({
            userId: users.id,
            name: users.name,
            email: users.email,
            role: desktopMembers.role,
            joinedAt: desktopMembers.joinedAt,
        })
            .from(desktopMembers)
            .innerJoin(users, eq(desktopMembers.userId, users.id))
            .where(eq(desktopMembers.desktopId, desktopId));
        return {
            members: result,
        };
    });
    /*
     * POST /desktops/:desktopId/members
     *
     * Add an existing user to a desktop.
     *
     * The user must already have an account.
     */
    app.post("/:desktopId/members", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        const { desktopId } = request.params;
        const isOwner = await requireOwner(desktopId, request.user.id, reply);
        if (!isOwner) {
            return;
        }
        const parsed = addMemberSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Invalid request",
                details: parsed.error.flatten(),
            });
        }
        const { email, role } = parsed.data;
        const userResult = await db
            .select({
            id: users.id,
            name: users.name,
            email: users.email,
        })
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        const user = userResult[0];
        if (!user) {
            return reply.status(404).send({
                error: "User not found",
            });
        }
        if (user.id === request.user.id) {
            return reply.status(400).send({
                error: "You are already the owner of this desktop",
            });
        }
        const existingMember = await db
            .select({
            userId: desktopMembers.userId,
        })
            .from(desktopMembers)
            .where(and(eq(desktopMembers.desktopId, desktopId), eq(desktopMembers.userId, user.id)))
            .limit(1);
        if (existingMember.length > 0) {
            return reply.status(409).send({
                error: "User is already a member of this desktop",
            });
        }
        const [member] = await db
            .insert(desktopMembers)
            .values({
            desktopId,
            userId: user.id,
            role,
        })
            .returning();
        if (!member) {
            return reply.status(500).send({
                error: "Failed to add member",
            });
        }
        const desktopResult = await db
            .select({
            name: desktops.name,
        })
            .from(desktops)
            .where(eq(desktops.id, desktopId))
            .limit(1);
        const desktop = desktopResult[0];
        if (!desktop) {
            return reply.status(404).send({
                error: "Desktop not found",
            });
        }
        if (!user.email || !user.name) {
            return reply.status(400).send({
                error: "This user has not completed their profile",
            });
        }
        if (!request.user.name) {
            return reply.status(400).send({
                error: "Please set your name before inviting members",
            });
        }
        try {
            await sendDesktopInvitation({
                recipientEmail: user.email,
                recipientName: user.name,
                inviterName: request.user.name,
                desktopName: desktop.name,
                desktopId,
                role,
            });
        }
        catch (error) {
            console.error("Failed to send desktop invitation:", error);
            /*
             * The member has already been added successfully.
             *
             * We don't undo the membership just because email delivery
             * failed. This can be retried later.
             */
            return reply.status(201).send({
                member: {
                    ...member,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                    },
                },
                emailSent: false,
            });
        }
        return reply.status(201).send({
            member: {
                ...member,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
            },
            emailSent: true,
        });
    });
    /*
     * PATCH /desktops/:desktopId/members/:userId
     *
     * Change a member's role.
     */
    app.patch("/:desktopId/members/:userId", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        const { desktopId, userId } = request.params;
        const isOwner = await requireOwner(desktopId, request.user.id, reply);
        if (!isOwner) {
            return;
        }
        if (userId === request.user.id) {
            return reply.status(400).send({
                error: "You cannot change your own role",
            });
        }
        const parsed = updateMemberSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "Invalid request",
                details: parsed.error.flatten(),
            });
        }
        const { role } = parsed.data;
        const [member] = await db
            .update(desktopMembers)
            .set({
            role,
        })
            .where(and(eq(desktopMembers.desktopId, desktopId), eq(desktopMembers.userId, userId)))
            .returning();
        if (!member) {
            return reply.status(404).send({
                error: "Member not found",
            });
        }
        return {
            member,
        };
    });
    /*
     * DELETE /desktops/:desktopId/members/:userId
     *
     * Remove a member from a desktop.
     */
    app.delete("/:desktopId/members/:userId", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({
                error: "Not authenticated",
            });
        }
        const { desktopId, userId } = request.params;
        const isOwner = await requireOwner(desktopId, request.user.id, reply);
        if (!isOwner) {
            return;
        }
        if (userId === request.user.id) {
            return reply.status(400).send({
                error: "The owner cannot remove themselves",
            });
        }
        const deleted = await db
            .delete(desktopMembers)
            .where(and(eq(desktopMembers.desktopId, desktopId), eq(desktopMembers.userId, userId)))
            .returning({
            userId: desktopMembers.userId,
        });
        if (deleted.length === 0) {
            return reply.status(404).send({
                error: "Member not found",
            });
        }
        return {
            success: true,
        };
    });
}
