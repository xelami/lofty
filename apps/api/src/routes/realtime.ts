import type { FastifyInstance } from "fastify"
import websocket from "@fastify/websocket"
import type { WebSocket } from "ws"

import { db } from "@lofty/db"
import { desktopMembers } from "@lofty/db/schema"

import { and, eq } from "drizzle-orm"

import {
  addConnection,
  removeConnection,
  broadcastToDesktop,
  getDesktopConnections,
} from "../services/realtime.js"

export async function realtimeRoutes(app: FastifyInstance) {
  await app.register(websocket)

  app.get(
    "/:desktopId/realtime",
    {
      websocket: true,
    },
    async (socket, request) => {
      const { desktopId } = request.params as {
        desktopId: string
      }

      /*
       * request.user comes from the existing auth plugin.
       */
      if (!request.user) {
        socket.close(1008, "Not authenticated")
        return
      }

      /*
       * Realtime presence requires a display name.
       */
      if (!request.user.name) {
        socket.close(1008, "Please set your name before connecting")
        return
      }

      /*
       * Make sure the user belongs to this desktop.
       */
      const membership = await db
        .select({
          role: desktopMembers.role,
        })
        .from(desktopMembers)
        .where(
          and(
            eq(desktopMembers.desktopId, desktopId),
            eq(desktopMembers.userId, request.user.id),
          ),
        )
        .limit(1)

      if (membership.length === 0) {
        socket.close(1008, "Not a member of this desktop")
        return
      }

      const connection = {
        userId: request.user.id,
        name: request.user.name,
        socket: socket as WebSocket,
      }

      /*
       * Add this user to the desktop's realtime room.
       */
      addConnection(desktopId, connection)

      /*
       * Tell the new client who is already online.
       */
      const existingUsers = Array.from(getDesktopConnections(desktopId))
        .filter((existing) => existing.socket !== socket)
        .map((existing) => ({
          userId: existing.userId,
          name: existing.name,
        }))

      socket.send(
        JSON.stringify({
          type: "presence.initial",
          users: existingUsers,
        }),
      )

      /*
       * Tell everyone else that this user joined.
       */
      broadcastToDesktop(
        desktopId,
        {
          type: "presence.joined",
          user: {
            userId: request.user.id,
            name: request.user.name,
          },
        },
        socket as WebSocket,
      )

      socket.on("message", (raw: any) => {
        try {
          const message = JSON.parse(raw.toString())

          if (!message || typeof message.type !== "string") {
            return
          }

          console.log("📨 REALTIME MESSAGE", {
            desktopId,
            message,
          })

          if (message.type === "cursor.move") {
            if (
              typeof message.x !== "number" ||
              typeof message.y !== "number"
            ) {
              return
            }

            broadcastToDesktop(
              desktopId,
              {
                type: "cursor.move",
                user: {
                  userId: request.user!.id,
                  name: request.user!.name,
                },
                x: message.x,
                y: message.y,
              },
              socket as WebSocket,
            )
          }
        } catch {
          /*
           * Ignore malformed messages.
           */
        }
      })

      socket.on("close", () => {
        removeConnection(desktopId, connection)

        broadcastToDesktop(desktopId, {
          type: "presence.left",
          userId: request.user!.id,
        })
      })

      socket.on("error", () => {
        removeConnection(desktopId, connection)
      })
    },
  )
}
