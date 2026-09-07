import { broadcastToDesktop } from "../services/realtime.js"

export type RealtimeEvent =
  | {
      type: "folder.created"
      folder: {
        id: string
        desktopId: string
        parentFolderId: string | null
        name: string
        createdBy: string
        createdAt: Date
        updatedAt: Date
      }
    }
  | {
      type: "folder.updated"
      folder: {
        id: string
        desktopId: string
        parentFolderId: string | null
        name: string
        createdBy: string
        createdAt: Date
        updatedAt: Date
      }
    }
  | {
      type: "folder.deleted"
      folderId: string
    }
  | {
      type: "file.created"
      file: {
        id: string
        desktopId: string
        folderId: string | null
        name: string
        mimeType: string
        size: number
        createdBy: string
        createdAt: Date
        updatedAt: Date
      }
    }
  | {
      type: "file.updated"
      file: {
        id: string
        desktopId: string
        folderId: string | null
        name: string
        mimeType: string
        size: number
        createdBy: string
        createdAt: Date
        updatedAt: Date
      }
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

export function broadcastEvent(
  desktopId: string,
  event: RealtimeEvent,
  exclude?: import("ws").WebSocket,
) {
  broadcastToDesktop(desktopId, event, exclude)
}
