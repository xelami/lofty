import { apiFetch } from "./client"

export type DesktopMember = {
  userId: string
  name: string
  email: string
  role: "owner" | "editor" | "viewer"
  joinedAt: string
}

export async function getDesktopMembers(desktopId: string) {
  return apiFetch<{
    members: DesktopMember[]
  }>(`/desktops/${desktopId}/members`)
}

export async function addDesktopMember(
  desktopId: string,
  email: string,
  role: "editor" | "viewer",
) {
  return apiFetch<{
    member: DesktopMember & {
      user: {
        id: string
        name: string
        email: string
      }
    }
    emailSent: boolean
  }>(`/desktops/${desktopId}/members`, {
    method: "POST",
    body: {
      email,
      role,
    },
  })
}
