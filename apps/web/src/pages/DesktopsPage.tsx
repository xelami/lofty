import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Navbar } from "../components/Navbar"

import {
  createDesktop,
  deleteDesktop,
  getDesktops,
  transferDesktop,
  type Desktop,
} from "../api/desktops"

import {
  addDesktopMember,
  getDesktopMembers,
  type DesktopMember,
} from "../api/members"

import { useAuthStore } from "../auth/authStore"

export function DesktopsPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const [desktops, setDesktops] = useState<Desktop[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [desktopName, setDesktopName] = useState("")
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)

  const [inviteDesktop, setInviteDesktop] = useState<Desktop | null>(null)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("viewer")
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const [manageDesktop, setManageDesktop] = useState<Desktop | null>(null)
  const [members, setMembers] = useState<DesktopMember[]>([])
  const [loadingMembers, setLoadingMembers] = useState(false)
  const [manageError, setManageError] = useState<string | null>(null)

  const [transferUserId, setTransferUserId] = useState("")
  const [transferring, setTransferring] = useState(false)
  const [showTransferConfirm, setShowTransferConfirm] = useState(false)

  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    async function loadDesktops() {
      try {
        setError(null)

        const result = await getDesktops()

        setDesktops(result.desktops)
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load desktops",
        )
      } finally {
        setLoading(false)
      }
    }

    void loadDesktops()
  }, [])

  function openCreateModal() {
    setDesktopName("")
    setCreateError(null)
    setShowCreateModal(true)
  }

  function closeCreateModal() {
    if (creating) {
      return
    }

    setShowCreateModal(false)
  }

  async function handleCreateDesktop(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const name = desktopName.trim()

    if (!name) {
      setCreateError("Desktop name cannot be empty")
      return
    }

    try {
      setCreating(true)
      setCreateError(null)

      const result = await createDesktop(name)

      setDesktops((current) => [...current, result.desktop])
      setShowCreateModal(false)
      setDesktopName("")
    } catch (error) {
      setCreateError(
        error instanceof Error ? error.message : "Failed to create desktop",
      )
    } finally {
      setCreating(false)
    }
  }

  function openInviteModal(desktop: Desktop) {
    setInviteDesktop(desktop)
    setInviteEmail("")
    setInviteRole("viewer")
    setInviteError(null)
    setInviteSuccess(null)
  }

  function closeInviteModal() {
    if (inviting) {
      return
    }

    setInviteDesktop(null)
    setInviteEmail("")
    setInviteError(null)
    setInviteSuccess(null)
  }

  async function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!inviteDesktop) {
      return
    }

    const email = inviteEmail.trim()

    if (!email) {
      setInviteError("Email address cannot be empty")
      return
    }

    try {
      setInviting(true)
      setInviteError(null)
      setInviteSuccess(null)

      const result = await addDesktopMember(inviteDesktop.id, email, inviteRole)

      if (result.emailSent) {
        setInviteSuccess(
          `${result.member.user.name} was added and an invitation email was sent.`,
        )
      } else {
        setInviteSuccess(
          `${result.member.user.name} was added, but the invitation email could not be sent.`,
        )
      }

      setInviteEmail("")

      if (manageDesktop?.id === inviteDesktop.id) {
        setMembers((current) => [
          ...current,
          {
            userId: result.member.user.id,
            name: result.member.user.name,
            email: result.member.user.email,
            role: inviteRole,
            joinedAt: new Date().toISOString(),
          },
        ])
      }
    } catch (error) {
      setInviteError(
        error instanceof Error ? error.message : "Failed to invite user",
      )
    } finally {
      setInviting(false)
    }
  }

  async function openManageModal(desktop: Desktop) {
    setManageDesktop(desktop)
    setMembers([])
    setTransferUserId("")
    setManageError(null)
    setShowTransferConfirm(false)
    setShowDeleteConfirm(false)
    setLoadingMembers(true)

    try {
      const result = await getDesktopMembers(desktop.id)

      setMembers(result.members)
    } catch (error) {
      setManageError(
        error instanceof Error ? error.message : "Failed to load members",
      )
    } finally {
      setLoadingMembers(false)
    }
  }

  function closeManageModal() {
    if (transferring || deleting) {
      return
    }

    setManageDesktop(null)
    setMembers([])
    setTransferUserId("")
    setManageError(null)
    setShowTransferConfirm(false)
    setShowDeleteConfirm(false)
  }

  function selectedTransferMember() {
    return members.find((member) => member.userId === transferUserId)
  }

  async function handleTransferOwnership() {
    if (!manageDesktop || !transferUserId) {
      return
    }

    try {
      setTransferring(true)
      setManageError(null)

      await transferDesktop(manageDesktop.id, transferUserId)

      const newOwner = selectedTransferMember()

      setDesktops((current) =>
        current.map((desktop) => {
          if (desktop.id !== manageDesktop.id) {
            return desktop
          }

          return {
            ...desktop,
            ownerId: transferUserId,
            role: "editor",
          }
        }),
      )

      setMembers((current) =>
        current.map((member) => {
          if (member.userId === transferUserId) {
            return {
              ...member,
              role: "owner",
            }
          }

          if (member.userId === user?.id) {
            return {
              ...member,
              role: "editor",
            }
          }

          return member
        }),
      )

      setManageDesktop((current) =>
        current
          ? {
              ...current,
              ownerId: transferUserId,
              role: "editor",
            }
          : current,
      )

      setShowTransferConfirm(false)
      setTransferUserId("")

      if (newOwner) {
        setManageError(
          `Ownership transferred to ${newOwner.name}. You are now an editor.`,
        )
      }
    } catch (error) {
      setManageError(
        error instanceof Error ? error.message : "Failed to transfer ownership",
      )
    } finally {
      setTransferring(false)
    }
  }

  async function handleDeleteDesktop() {
    if (!manageDesktop) {
      return
    }

    try {
      setDeleting(true)
      setManageError(null)

      await deleteDesktop(manageDesktop.id)

      setDesktops((current) =>
        current.filter((desktop) => desktop.id !== manageDesktop.id),
      )

      setManageDesktop(null)
      setMembers([])
      setShowDeleteConfirm(false)
    } catch (error) {
      setManageError(
        error instanceof Error ? error.message : "Failed to delete desktop",
      )
    } finally {
      setDeleting(false)
    }
  }

  const transferCandidates = members.filter(
    (member) => member.userId !== user?.id,
  )

  const selectedMember = selectedTransferMember()

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U"

  return (
    <div className="min-h-screen bg-lofty-bg text-lofty-ink">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-lofty-pink opacity-30 blur-3xl" />
        <div className="absolute right-0 top-32 h-96 w-96 rounded-full bg-lofty-sky opacity-35 blur-3xl" />
      </div>

      <Navbar />

      <main className="relative mx-auto max-w-7xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-black/30">
              <span>Workspace</span>
              <span className="text-black/15">/</span>
              <span className="text-black/50">Desktops</span>
            </div>

            <h1 className="text-4xl font-black tracking-[-0.06em] sm:text-5xl">
              Your desktops
            </h1>

            <p className="mt-3 text-sm leading-6 text-black/45 sm:text-base">
              Choose a workspace to continue.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-lofty-ink px-5 py-3 text-sm font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
          >
            <span className="text-lg leading-none">+</span>
            New desktop
          </button>
        </div>

        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-[28px] border border-black/10 bg-white/50"
              />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-50/70 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10 font-black text-red-500">
                !
              </div>

              <div>
                <h2 className="text-sm font-black text-red-700">
                  Unable to load desktops
                </h2>

                <p className="mt-1 text-sm text-red-600/70">{error}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && desktops.length === 0 && (
          <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-white/55 px-6 py-24 text-center shadow-sm backdrop-blur-xl">
            <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-80 -translate-x-1/2 rounded-full bg-lofty-sky opacity-50 blur-3xl" />

            <div className="relative">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-black/10 bg-[#ecece8] text-2xl shadow-sm">
                🖥️
              </div>

              <h2 className="text-2xl font-black tracking-tight">
                Create your first desktop
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-black/45">
                A desktop gives you a shared space for your files, folders and
                collaborators.
              </p>

              <button
                type="button"
                onClick={openCreateModal}
                className="mt-8 rounded-2xl bg-lofty-ink px-6 py-3 text-sm font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
              >
                Create desktop
              </button>
            </div>
          </div>
        )}

        {!loading && !error && desktops.length > 0 && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-black/30">
                {desktops.length}{" "}
                {desktops.length === 1 ? "desktop" : "desktops"}
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {desktops.map((desktop) => (
                <div
                  key={desktop.id}
                  className="group relative overflow-hidden rounded-[28px] border border-black/10 bg-white/65 p-5 shadow-sm backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_20px_50px_rgba(30,30,30,0.10)]"
                >
                  <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-lofty-sky opacity-0 blur-3xl transition duration-500 group-hover:opacity-60" />

                  <div className="relative">
                    <div className="mb-7 flex items-start justify-between">
                      <Link
                        to={`/desktops/${desktop.id}`}
                        aria-label={`Open ${desktop.name}`}
                        className="flex h-14 w-14 items-center justify-center rounded-2xl border border-black/10 bg-[#ecece8] text-2xl shadow-sm transition group-hover:border-black/15 group-hover:bg-white"
                      >
                        🖥️
                      </Link>

                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                          desktop.role === "owner"
                            ? "border-lofty-blue/20 bg-lofty-blue/10 text-lofty-blue"
                            : "border-black/10 bg-black/3 text-black/40"
                        }`}
                      >
                        {desktop.role}
                      </span>
                    </div>

                    <Link to={`/desktops/${desktop.id}`} className="block">
                      <h2 className="truncate text-lg font-black tracking-tight">
                        {desktop.name}
                      </h2>

                      <p className="mt-1.5 text-sm font-medium text-black/40 transition group-hover:text-black/60">
                        Open desktop{" "}
                        <span className="ml-1 transition group-hover:ml-2">
                          →
                        </span>
                      </p>
                    </Link>

                    {desktop.role === "owner" && (
                      <div className="mt-6 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => openInviteModal(desktop)}
                          className="rounded-xl border border-black/10 bg-lofty-bg/80 px-3 py-2.5 text-sm font-bold text-black/45 transition hover:border-black/15 hover:bg-white hover:text-lofty-ink"
                        >
                          <span className="mr-1.5 text-base">+</span>
                          Invite
                        </button>

                        <button
                          type="button"
                          onClick={() => void openManageModal(desktop)}
                          className="rounded-xl border border-black/10 bg-lofty-bg/80 px-3 py-2.5 text-sm font-bold text-black/45 transition hover:border-black/15 hover:bg-white hover:text-lofty-ink"
                        >
                          <span className="mr-1.5">⚙</span>
                          Manage
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* Create desktop modal */}

      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-lofty-ink/35 px-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeCreateModal()
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-black/10 bg-lofty-bg shadow-[0_30px_80px_rgba(20,20,20,0.25)]">
            <div className="border-b border-black/10 px-6 py-5">
              <h2 className="text-xl font-black tracking-tight">
                Create a desktop
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-black/45">
                Create a new workspace for your files and collaborators.
              </p>
            </div>

            <form onSubmit={handleCreateDesktop} className="p-6">
              <label
                htmlFor="desktop-name"
                className="mb-2 block text-sm font-bold text-black/65"
              >
                Desktop name
              </label>

              <input
                id="desktop-name"
                type="text"
                value={desktopName}
                onChange={(event) => setDesktopName(event.target.value)}
                placeholder="e.g. Work"
                autoFocus
                maxLength={100}
                disabled={creating}
                className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-lofty-ink outline-none transition placeholder:text-black/25 focus:border-lofty-blue/50 focus:bg-white focus:ring-4 focus:ring-lofty-blue/10"
              />

              {createError && (
                <p className="mt-2 text-sm font-medium text-red-500">
                  {createError}
                </p>
              )}

              <div className="mt-7 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creating}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-black/40 transition hover:bg-black/5 hover:text-lofty-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creating || !desktopName.trim()}
                  className="rounded-xl bg-lofty-ink px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {creating ? "Creating..." : "Create desktop"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invite modal */}

      {inviteDesktop && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-lofty-ink/35 px-4 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeInviteModal()
            }
          }}
        >
          <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-black/10 bg-lofty-bg shadow-[0_30px_80px_rgba(20,20,20,0.25)]">
            <div className="border-b border-black/10 px-6 py-5">
              <h2 className="text-xl font-black tracking-tight">
                Invite people
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-black/45">
                Add someone to{" "}
                <span className="font-bold text-black/65">
                  {inviteDesktop.name}
                </span>
                .
              </p>
            </div>

            <form onSubmit={handleInvite} className="p-6">
              <label
                htmlFor="invite-email"
                className="mb-2 block text-sm font-bold text-black/65"
              >
                Email address
              </label>

              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="person@example.com"
                autoFocus
                disabled={inviting}
                className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-lofty-ink outline-none transition placeholder:text-black/25 focus:border-lofty-blue/50 focus:bg-white focus:ring-4 focus:ring-lofty-blue/10"
              />

              <label
                htmlFor="invite-role"
                className="mb-2 mt-5 block text-sm font-bold text-black/65"
              >
                Role
              </label>

              <select
                id="invite-role"
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(event.target.value as "editor" | "viewer")
                }
                disabled={inviting}
                className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-lofty-ink outline-none transition focus:border-lofty-blue/50 focus:bg-white focus:ring-4 focus:ring-lofty-blue/10"
              >
                <option value="viewer">
                  Viewer — can view files and folders
                </option>

                <option value="editor">
                  Editor — can modify files and folders
                </option>
              </select>

              {inviteError && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-50/70 p-3 text-sm font-medium text-red-600">
                  {inviteError}
                </div>
              )}

              {inviteSuccess && (
                <div className="mt-4 flex gap-3 rounded-xl border border-[#72c48b]/30 bg-[#72c48b]/10 p-3 text-sm font-medium text-[#3d8b52]">
                  <span className="shrink-0 font-black">✓</span>
                  <span>{inviteSuccess}</span>
                </div>
              )}

              <div className="mt-7 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeInviteModal}
                  disabled={inviting}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-black/40 transition hover:bg-black/5 hover:text-lofty-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Done
                </button>

                <button
                  type="submit"
                  disabled={inviting || !inviteEmail.trim()}
                  className="rounded-xl bg-lofty-ink px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {inviting ? "Adding..." : "Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage desktop modal */}

      {manageDesktop && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-lofty-ink/35 px-4 py-6 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeManageModal()
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-black/10 bg-lofty-bg shadow-[0_30px_80px_rgba(20,20,20,0.25)]">
            <div className="border-b border-black/10 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black tracking-tight">
                    Manage desktop
                  </h2>

                  <p className="mt-1.5 text-sm leading-6 text-black/45">
                    Manage{" "}
                    <span className="font-bold text-black/65">
                      {manageDesktop.name}
                    </span>{" "}
                    and its ownership.
                  </p>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-black/10 bg-white/60 text-lg shadow-sm">
                  🖥️
                </div>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-6">
              {manageError && (
                <div
                  className={`mb-5 rounded-xl border p-3 text-sm font-medium ${
                    manageError.includes("transferred")
                      ? "border-[#72c48b]/30 bg-[#72c48b]/10 text-[#3d8b52]"
                      : "border-red-500/20 bg-red-50/70 text-red-600"
                  }`}
                >
                  {manageError}
                </div>
              )}

              <section>
                <div className="mb-3">
                  <h3 className="text-sm font-black">Transfer ownership</h3>

                  <p className="mt-1 text-xs leading-5 text-black/40">
                    Ownership can only be transferred to someone who is already
                    a member of this desktop.
                  </p>
                </div>

                {loadingMembers ? (
                  <div className="rounded-2xl border border-black/10 bg-white/50 p-4">
                    <div className="h-4 w-32 animate-pulse rounded bg-black/10" />
                    <div className="mt-3 h-10 animate-pulse rounded-xl bg-black/5" />
                  </div>
                ) : transferCandidates.length === 0 ? (
                  <div className="rounded-2xl border border-black/10 bg-white/50 p-4">
                    <p className="text-sm font-bold text-black/50">
                      No other members
                    </p>

                    <p className="mt-1 text-xs leading-5 text-black/35">
                      Invite someone to this desktop before transferring
                      ownership.
                    </p>
                  </div>
                ) : (
                  <>
                    <select
                      value={transferUserId}
                      onChange={(event) => {
                        setTransferUserId(event.target.value)
                        setShowTransferConfirm(false)
                      }}
                      disabled={transferring}
                      className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-lofty-ink outline-none transition focus:border-lofty-blue/50 focus:bg-white focus:ring-4 focus:ring-lofty-blue/10"
                    >
                      <option value="">Choose a collaborator...</option>

                      {transferCandidates.map((member) => (
                        <option key={member.userId} value={member.userId}>
                          {member.name} — {member.email} ({member.role})
                        </option>
                      ))}
                    </select>

                    {selectedMember && !showTransferConfirm && (
                      <button
                        type="button"
                        onClick={() => setShowTransferConfirm(true)}
                        disabled={transferring}
                        className="mt-3 w-full rounded-xl border border-black/10 bg-white/70 px-4 py-2.5 text-sm font-bold text-black/55 transition hover:border-black/15 hover:bg-white hover:text-lofty-ink disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Transfer ownership
                      </button>
                    )}

                    {showTransferConfirm && selectedMember && (
                      <div className="mt-3 rounded-2xl border border-lofty-blue/20 bg-lofty-blue/5 p-4">
                        <p className="text-sm font-bold text-lofty-ink">
                          Transfer ownership to {selectedMember.name}?
                        </p>

                        <p className="mt-2 text-xs leading-5 text-black/45">
                          You will become an editor and{" "}
                          <span className="font-bold text-black/60">
                            {selectedMember.name}
                          </span>{" "}
                          will become the owner.
                        </p>

                        <div className="mt-4 flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowTransferConfirm(false)}
                            disabled={transferring}
                            className="rounded-xl px-4 py-2 text-sm font-bold text-black/40 transition hover:bg-black/5 hover:text-lofty-ink disabled:opacity-50"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleTransferOwnership()}
                            disabled={transferring}
                            className="rounded-xl bg-lofty-ink px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {transferring
                              ? "Transferring..."
                              : "Confirm transfer"}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>

              <div className="my-7 border-t border-black/10" />

              <section>
                <div className="mb-3">
                  <h3 className="text-sm font-black text-red-600">
                    Danger zone
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-black/40">
                    Deleting this desktop permanently removes its files, folders
                    and collaborator memberships.
                  </p>
                </div>

                {!showDeleteConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={deleting}
                    className="w-full rounded-xl border border-red-500/20 bg-red-50/60 px-4 py-2.5 text-sm font-bold text-red-500 transition hover:border-red-500/30 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Delete desktop
                  </button>
                ) : (
                  <div className="rounded-2xl border border-red-500/20 bg-red-50/60 p-4">
                    <p className="text-sm font-black text-red-700">
                      Delete "{manageDesktop.name}"?
                    </p>

                    <p className="mt-2 text-xs leading-5 text-red-600/70">
                      This permanently deletes the desktop, including its files,
                      folders and collaborators. This cannot be undone.
                    </p>

                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={deleting}
                        className="rounded-xl px-4 py-2 text-sm font-bold text-black/40 transition hover:bg-black/5 hover:text-lofty-ink disabled:opacity-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDeleteDesktop()}
                        disabled={deleting}
                        className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white shadow-[3px_3px_0_rgba(185,28,28,0.18)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {deleting ? "Deleting..." : "Delete desktop"}
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="border-t border-black/10 px-6 py-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={closeManageModal}
                  disabled={transferring || deleting}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-black/40 transition hover:bg-black/5 hover:text-lofty-ink disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
