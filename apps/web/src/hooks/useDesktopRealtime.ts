import { useEffect, useRef, useState } from "react"

type Collaborator = {
  userId: string
  name: string
}

export type RemoteCursor = {
  userId: string
  name: string
  x: number
  y: number
}

export type RealtimeFolder = {
  id: string
  desktopId: string
  parentFolderId: string | null
  name: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type RealtimeFile = {
  id: string
  desktopId: string
  folderId: string | null
  name: string
  mimeType: string
  size: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type RealtimeMessage =
  | {
      type: "presence.initial"
      users: Collaborator[]
    }
  | {
      type: "presence.joined"
      user: Collaborator
    }
  | {
      type: "presence.left"
      userId: string
    }
  | {
      type: "cursor.move"
      user: Collaborator
      x: number
      y: number
    }
  | {
      type: "folder.created"
      folder: RealtimeFolder
    }
  | {
      type: "folder.updated"
      folder: RealtimeFolder
    }
  | {
      type: "folder.deleted"
      folderId: string
    }
  | {
      type: "file.created"
      file: RealtimeFile
    }
  | {
      type: "file.updated"
      file: RealtimeFile
    }
  | {
      type: "file.deleted"
      fileId: string
    }
  | {
      type: "desktop.item.moved"
      itemId: string
      folderId: string | null
      fileId: string | null
      x: number
      y: number
    }

function getWebSocketUrl() {
  const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3001"

  return apiUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:")
}

export function useDesktopRealtime(desktopId: string | undefined) {
  const socketRef = useRef<WebSocket | null>(null)
  const lastCursorSentRef = useRef(0)

  const [connected, setConnected] = useState(false)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [cursors, setCursors] = useState<Record<string, RemoteCursor>>({})

  /*
   * Realtime desktop changes.
   *
   * These are deliberately exposed through callbacks rather than
   * maintaining a second copy of your entire desktop state here.
   *
   * Your desktop/file explorer can decide how it wants to update
   * its own state when these events arrive.
   */
  const [lastEvent, setLastEvent] = useState<RealtimeMessage | null>(null)

  useEffect(() => {
    if (!desktopId) {
      setConnected(false)
      setCollaborators([])
      setCursors({})
      setLastEvent(null)

      return
    }

    const socket = new WebSocket(
      `${getWebSocketUrl()}/desktops/${desktopId}/realtime`,
    )

    socketRef.current = socket

    socket.onopen = () => {
      setConnected(true)
    }

    socket.onclose = () => {
      setConnected(false)

      setCollaborators([])
      setCursors({})

      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }

    socket.onerror = () => {
      setConnected(false)
    }

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as RealtimeMessage

        console.log("📨 REALTIME RECEIVED", message)

        switch (message.type) {
          /*
           * Presence
           */
          case "presence.initial": {
            setCollaborators(message.users)
            break
          }

          case "presence.joined": {
            setCollaborators((current) => {
              const alreadyExists = current.some(
                (user) => user.userId === message.user.userId,
              )
              if (alreadyExists) {
                return current
              }
              return [...current, message.user]
            })
            break
          }

          case "presence.left": {
            setCollaborators((current) =>
              current.filter((user) => user.userId !== message.userId),
            )

            setCursors((current) => {
              const next = { ...current }
              delete next[message.userId]
              return next
            })
            break
          }

          /*
           * Remote cursor
           */
          case "cursor.move": {
            setCursors((current) => ({
              ...current,
              [message.user.userId]: {
                userId: message.user.userId,
                name: message.user.name,
                x: message.x,
                y: message.y,
              },
            }))
            break
          }

          /*
           * Desktop changes
           *
           * Store the latest event so the desktop/file explorer
           * can react to it.
           */

          case "folder.created":
          case "folder.updated":
          case "folder.deleted":
          case "file.created":
          case "file.updated":
          case "file.deleted": {
            setLastEvent(message)
            break
          }
          case "desktop.item.moved": {
            console.log("🖥️ ITEM MOVED RECEIVED", message)

            setLastEvent(message)
            break
          }
        }
      } catch {
        // Ignore malformed realtime messages.
      }
    }

    return () => {
      socket.close()

      if (socketRef.current === socket) {
        socketRef.current = null
      }
    }
  }, [desktopId])

  /*
   * Send the local cursor position to everyone else.
   *
   * 50ms = maximum 20 cursor updates per second.
   */
  function sendCursor(x: number, y: number) {
    const socket = socketRef.current

    if (!socket || socket.readyState !== WebSocket.OPEN) {
      return
    }

    const now = Date.now()

    if (now - lastCursorSentRef.current < 50) {
      return
    }

    lastCursorSentRef.current = now

    socket.send(
      JSON.stringify({
        type: "cursor.move",
        x,
        y,
      }),
    )
  }

  return {
    connected,
    collaborators,
    cursors,

    /*
     * Latest folder/file change received from another user.
     *
     * The UI can watch this value with useEffect.
     */
    lastEvent,

    sendCursor,
  }
}
