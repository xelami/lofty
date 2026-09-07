export type DesktopRole = "owner" | "editor" | "viewer"

export function canReadDesktop(role: DesktopRole): boolean {
  return role === "owner" || role === "editor" || role === "viewer"
}

export function canEditFiles(role: DesktopRole): boolean {
  return role === "owner" || role === "editor"
}

export function canEditDesktop(role: DesktopRole): boolean {
  return role === "owner"
}

export function canManageMembers(role: DesktopRole): boolean {
  return role === "owner"
}
