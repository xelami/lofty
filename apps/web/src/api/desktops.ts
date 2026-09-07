import { apiFetch } from "./client"
import type { Folder } from "./files"

export type DesktopSettings = {
  theme: {
    backgroundColor: string
    accentColor: string
    windowStyle: "classic" | "glass" | "flat" | "retro"
    windowOpacity: number
    taskbarStyle: "classic" | "floating" | "minimal"
    taskbarPosition: "bottom" | "top"
    iconStyle: "classic" | "minimal" | "pixel"
    font: "system" | "mono" | "pixel"
  }

  layout: {
    iconSize: "small" | "medium" | "large"
    iconSpacing: "compact" | "comfortable" | "wide"
    iconLabelPosition: "below" | "right" | "hidden"
    showTaskbar: boolean
    showClock: boolean
    showCollaborators: boolean
  }
}

export type DesktopSettingsUpdate = {
  theme?: Partial<DesktopSettings["theme"]>
  layout?: Partial<DesktopSettings["layout"]>
}

export type Desktop = {
  id: string
  name: string
  ownerId: string
  createdAt: string
  updatedAt: string
  wallpaper: string | null
  settings: DesktopSettings
  role: "owner" | "editor" | "viewer"
}

export type DesktopItem = {
  id: string
  desktopId: string
  folderId: string | null
  fileId: string | null
  x: number
  y: number
  createdAt: string
  updatedAt: string
}

export async function getDesktops() {
  return apiFetch<{
    desktops: Desktop[]
  }>("/desktops")
}

export async function createDesktop(name: string) {
  return apiFetch<{ desktop: Desktop }>("/desktops", {
    method: "POST",
    body: { name },
  })
}

export async function updateDesktop(
  desktopId: string,
  updates: {
    name?: string
    wallpaper?: string | null
    settings?: DesktopSettingsUpdate
  },
): Promise<{ desktop: Desktop }> {
  return apiFetch<{ desktop: Desktop }>(`/desktops/${desktopId}`, {
    method: "PATCH",
    body: updates,
  })
}

export async function deleteDesktop(desktopId: string) {
  return apiFetch<{
    success: true
  }>(`/desktops/${desktopId}`, {
    method: "DELETE",
  })
}

export async function transferDesktop(desktopId: string, userId: string) {
  return apiFetch<{
    success: true
    message: string
    ownerId: string
  }>(`/desktops/${desktopId}/transfer`, {
    method: "POST",
    body: {
      userId,
    },
  })
}

/* -------------------------------------------------------------------------- */
/* Desktop items                                                               */
/* -------------------------------------------------------------------------- */

export async function getDesktopItems(desktopId: string) {
  return apiFetch<{
    items: DesktopItem[]
  }>(`/desktops/${desktopId}/items`)
}

export async function updateDesktopItemPosition(
  desktopId: string,
  itemId: string,
  x: number,
  y: number,
) {
  return apiFetch<{
    item: DesktopItem
  }>(`/desktops/${desktopId}/items/${itemId}`, {
    method: "PATCH",
    body: {
      x,
      y,
    },
  })
}

export async function updateDesktopItemPositions(
  desktopId: string,
  items: Array<{
    id: string
    x: number
    y: number
  }>,
) {
  return apiFetch<{
    items: Array<{
      id: string
      desktopId: string
      folderId: string | null
      fileId: string | null
      x: number
      y: number
    }>
  }>(`/desktops/${desktopId}/items/positions`, {
    method: "PATCH",
    body: {
      items,
    },
  })
}

export async function renameFolder(folderId: string, name: string) {
  return apiFetch<{
    folder: Folder
  }>(`/folders/${folderId}`, {
    method: "PATCH",
    body: {
      name,
    },
  })
}
