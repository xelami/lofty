import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"

import { Navbar } from "../components/Navbar"
import { useAuthStore } from "../auth/authStore"

import { deleteDesktop, transferDesktop } from "../api/desktops"

import { getDesktopMembers, type DesktopMember } from "../api/members"

const API_URL = import.meta.env.VITE_API_URL

type OwnedDesktop = {
  id: string
  name: string
}

export function SettingsPage() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const navigate = useNavigate()

  const [name, setName] = useState(user?.name ?? "")
  const [email, setEmail] = useState(user?.email ?? "")

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [emailVerificationRequired, setEmailVerificationRequired] =
    useState(false)
  const [error, setError] = useState<string | null>(null)

  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(
    null,
  )

  const [ownedDesktops, setOwnedDesktops] = useState<OwnedDesktop[]>([])

  const [transferDesktopTarget, setTransferDesktopTarget] =
    useState<OwnedDesktop | null>(null)

  const [transferMembers, setTransferMembers] = useState<DesktopMember[]>([])
  const [loadingTransferMembers, setLoadingTransferMembers] = useState(false)
  const [transferUserId, setTransferUserId] = useState("")
  const [transferring, setTransferring] = useState(false)
  const [transferError, setTransferError] = useState<string | null>(null)

  const [deletingDesktopId, setDeletingDesktopId] = useState<string | null>(
    null,
  )

  useEffect(() => {
    if (user) {
      setName(user.name ?? "")
      setEmail(user.email ?? "")
    }
  }, [user])

  async function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user?.hasPassword) {
      return
    }

    const trimmedName = name.trim()
    const normalizedEmail = email.trim().toLowerCase()

    if (!trimmedName) {
      setError("Name cannot be empty")
      return
    }

    if (!normalizedEmail) {
      setError("Email cannot be empty")
      return
    }

    if (!normalizedEmail.includes("@")) {
      setError("Please enter a valid email address")
      return
    }

    const nameChanged = trimmedName !== user.name
    const emailChanged =
      normalizedEmail !== (user.email ?? "").trim().toLowerCase()

    if (!nameChanged && !emailChanged) {
      setSaved(true)
      setError(null)
      return
    }

    try {
      setSaving(true)
      setSaved(false)
      setEmailVerificationRequired(false)
      setError(null)

      const response = await fetch(`${API_URL}/profiles`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(nameChanged ? { name: trimmedName } : {}),
          ...(emailChanged ? { email: normalizedEmail } : {}),
        }),
      })

      const data = (await response.json().catch(() => null)) as {
        user?: {
          id: string
          name: string
          email: string | null
          hasPassword: boolean
          createdAt: string
        }
        emailVerificationRequired?: boolean
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to update profile")
      }

      if (!data?.user) {
        throw new Error("Invalid response from server")
      }

      useAuthStore.setState({
        user: data.user,
      })

      setName(data.user.name)
      setEmail(data.user.email ?? "")
      setEmailVerificationRequired(data.emailVerificationRequired === true)
      setSaved(true)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to update profile",
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    try {
      setDeletingAccount(true)
      setDeleteAccountError(null)

      const response = await fetch(`${API_URL}/auth/account`, {
        method: "DELETE",
        credentials: "include",
      })

      const data = (await response.json().catch(() => null)) as {
        success?: boolean
        error?: string
        code?: string
        desktops?: OwnedDesktop[]
      } | null

      if (response.status === 409 && data?.code === "ACCOUNT_OWNS_DESKTOPS") {
        setOwnedDesktops(data.desktops ?? [])
        setDeleteAccountError(
          "You must transfer or delete all desktops you own before deleting your account.",
        )
        return
      }

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to delete account")
      }

      if (data?.success === true) {
        useAuthStore.setState({
          user: null,
        })

        navigate("/login")
        return
      }

      throw new Error("Invalid response from server")
    } catch (error) {
      setDeleteAccountError(
        error instanceof Error ? error.message : "Failed to delete account",
      )
    } finally {
      setDeletingAccount(false)
    }
  }

  async function openTransferModal(desktop: OwnedDesktop) {
    setTransferDesktopTarget(desktop)
    setTransferMembers([])
    setTransferUserId("")
    setTransferError(null)
    setLoadingTransferMembers(true)

    try {
      const result = await getDesktopMembers(desktop.id)

      setTransferMembers(
        result.members.filter((member) => member.userId !== user?.id),
      )
    } catch (error) {
      setTransferError(
        error instanceof Error
          ? error.message
          : "Failed to load desktop members",
      )
    } finally {
      setLoadingTransferMembers(false)
    }
  }

  function closeTransferModal() {
    if (transferring) {
      return
    }

    setTransferDesktopTarget(null)
    setTransferMembers([])
    setTransferUserId("")
    setTransferError(null)
  }

  async function handleTransferOwnership() {
    if (!transferDesktopTarget || !transferUserId) {
      return
    }

    const selectedMember = transferMembers.find(
      (member) => member.userId === transferUserId,
    )

    if (!selectedMember) {
      setTransferError("Please select a member")
      return
    }

    const confirmed = window.confirm(
      `Transfer "${transferDesktopTarget.name}" to ${selectedMember.name}? You will become an editor.`,
    )

    if (!confirmed) {
      return
    }

    try {
      setTransferring(true)
      setTransferError(null)

      await transferDesktop(transferDesktopTarget.id, transferUserId)

      setOwnedDesktops((current) =>
        current.filter((desktop) => desktop.id !== transferDesktopTarget.id),
      )

      closeTransferModal()
      setDeleteAccountError(
        "Ownership transferred successfully. You can now delete your account if you have no other desktops.",
      )
    } catch (error) {
      setTransferError(
        error instanceof Error ? error.message : "Failed to transfer ownership",
      )
    } finally {
      setTransferring(false)
    }
  }

  async function handleDeleteOwnedDesktop(desktop: OwnedDesktop) {
    const confirmed = window.confirm(
      `Delete "${desktop.name}" permanently? All files, folders and desktop data will be deleted. This cannot be undone.`,
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingDesktopId(desktop.id)
      setDeleteAccountError(null)

      await deleteDesktop(desktop.id)

      setOwnedDesktops((current) =>
        current.filter((item) => item.id !== desktop.id),
      )

      setDeleteAccountError(
        "Desktop deleted successfully. You can now delete your account if you have no other desktops.",
      )
    } catch (error) {
      setDeleteAccountError(
        error instanceof Error ? error.message : "Failed to delete desktop",
      )
    } finally {
      setDeletingDesktopId(null)
    }
  }

  async function handleLogout() {
    await logout()
  }

  const initials =
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U"

  return (
    <div className="min-h-screen bg-lofty-bg text-lofty-ink">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-lofty-pink opacity-25 blur-3xl" />
        <div className="absolute right-0 top-32 h-96 w-96 rounded-full bg-lofty-sky opacity-30 blur-3xl" />
      </div>

      <Navbar />

      <main className="relative mx-auto max-w-5xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-black/30">
            <Link to="/desktops" className="transition hover:text-black/60">
              Workspace
            </Link>

            <span className="text-black/15">/</span>

            <span className="text-black/50">Settings</span>
          </div>

          <h1 className="text-4xl font-black tracking-[-0.06em] sm:text-5xl">
            Settings
          </h1>

          <p className="mt-3 text-sm leading-6 text-black/45 sm:text-base">
            Manage your account and LOFTY preferences.
          </p>
        </div>

        <div className="grid gap-6">
          {user?.hasPassword && (
            <section className="overflow-hidden rounded-[28px] border border-black/10 bg-white/65 shadow-sm backdrop-blur-xl">
              <div className="border-b border-black/10 px-6 py-5 sm:px-7">
                <h2 className="text-lg font-black tracking-tight">Profile</h2>

                <p className="mt-1 text-sm text-black/40">
                  Update the information associated with your LOFTY account.
                </p>
              </div>

              <form
                onSubmit={handleSaveProfile}
                className="px-6 py-6 sm:px-7 sm:py-7"
              >
                <div className="mb-7 flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-lofty-ink text-lg font-black text-white shadow-lofty-offset-sm">
                    {initials}
                  </div>

                  <div>
                    <p className="text-sm font-black text-lofty-ink">
                      {user.name}
                    </p>

                    <p className="mt-1 text-sm text-black/40">
                      Your profile name and avatar.
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="settings-name"
                      className="mb-2 block text-sm font-bold text-black/65"
                    >
                      Name
                    </label>

                    <input
                      id="settings-name"
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value)
                        setSaved(false)
                        setError(null)
                      }}
                      maxLength={100}
                      disabled={saving}
                      className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-lofty-ink outline-none transition placeholder:text-black/25 focus:border-lofty-blue/50 focus:bg-white focus:ring-4 focus:ring-lofty-blue/10 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label
                      htmlFor="settings-email"
                      className="mb-2 block text-sm font-bold text-black/65"
                    >
                      Email address
                    </label>

                    <input
                      id="settings-email"
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        setSaved(false)
                        setEmailVerificationRequired(false)
                        setError(null)
                      }}
                      maxLength={255}
                      disabled={saving}
                      className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-lofty-ink outline-none transition placeholder:text-black/25 focus:border-lofty-blue/50 focus:bg-white focus:ring-4 focus:ring-lofty-blue/10 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <p className="mt-2 text-xs text-black/30">
                      Changing your email address will require you to verify the
                      new address.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mt-5 rounded-xl border border-red-500/20 bg-red-50/70 px-4 py-3 text-sm font-medium text-red-600">
                    {error}
                  </div>
                )}

                {emailVerificationRequired && (
                  <div className="mt-5 rounded-xl border border-lofty-blue/20 bg-lofty-blue/5 px-4 py-3 text-sm font-medium text-lofty-ink">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 font-black">✉</span>

                      <div>
                        <p className="font-black">
                          Check your new email address.
                        </p>

                        <p className="mt-1 font-normal text-black/45">
                          We've sent a verification link to{" "}
                          <span className="font-bold text-black/60">
                            {email}
                          </span>
                          . Your new email address won't be fully verified until
                          you click the link.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {saved && !emailVerificationRequired && (
                  <div className="mt-5 flex items-center gap-2 rounded-xl border border-[#72c48b]/30 bg-[#72c48b]/10 px-4 py-3 text-sm font-medium text-[#3d8b52]">
                    <span className="font-black">✓</span>
                    Profile updated successfully.
                  </div>
                )}

                <div className="mt-7 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving || !name.trim() || !email.trim()}
                    className="rounded-xl bg-lofty-ink px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <section className="overflow-hidden rounded-[28px] border border-black/10 bg-white/65 shadow-sm backdrop-blur-xl">
            <div className="border-b border-black/10 px-6 py-5 sm:px-7">
              <h2 className="text-lg font-black tracking-tight">Account</h2>

              <p className="mt-1 text-sm text-black/40">
                Manage your account access and session.
              </p>
            </div>

            <div className="divide-y divide-black/10">
              {user?.hasPassword && (
                <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <div>
                    <h3 className="text-sm font-black">Password</h3>

                    <p className="mt-1 text-sm text-black/40">
                      Change your account password.
                    </p>
                  </div>

                  <Link
                    to="/reset-password"
                    className="inline-flex w-fit shrink-0 rounded-xl border border-black/10 bg-white/60 px-4 py-2.5 text-sm font-bold text-black/55 transition hover:bg-white hover:text-lofty-ink"
                  >
                    Change password
                  </Link>
                </div>
              )}

              <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div>
                  <h3 className="text-sm font-black">Current session</h3>

                  <p className="mt-1 text-sm text-black/40">
                    You are currently signed in to this account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void handleLogout()}
                  className="inline-flex w-fit rounded-xl border border-black/10 bg-white/60 px-4 py-2.5 text-sm font-bold text-black/50 transition hover:bg-white hover:text-lofty-ink"
                >
                  Sign out
                </button>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-black/10 bg-white/65 shadow-sm backdrop-blur-xl">
            <div className="border-b border-black/10 px-6 py-5 sm:px-7">
              <h2 className="text-lg font-black tracking-tight">Preferences</h2>

              <p className="mt-1 text-sm text-black/40">
                Customize how LOFTY behaves for you.
              </p>
            </div>

            <div className="divide-y divide-black/10">
              <div className="flex items-center justify-between gap-5 px-6 py-6 sm:px-7">
                <div>
                  <h3 className="text-sm font-black">Notifications</h3>

                  <p className="mt-1 text-sm text-black/40">
                    Notification preferences will be available here.
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-black/10 bg-black/3 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black/30">
                  Coming soon
                </span>
              </div>

              <div className="flex items-center justify-between gap-5 px-6 py-6 sm:px-7">
                <div>
                  <h3 className="text-sm font-black">Appearance</h3>

                  <p className="mt-1 text-sm text-black/40">
                    Theme and visual preferences will be available here.
                  </p>
                </div>

                <span className="shrink-0 rounded-full border border-black/10 bg-black/3 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black/30">
                  Coming soon
                </span>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-red-500/15 bg-red-50/40 shadow-sm backdrop-blur-xl">
            <div className="border-b border-red-500/10 px-6 py-5 sm:px-7">
              <h2 className="text-lg font-black tracking-tight text-red-700">
                Danger zone
              </h2>

              <p className="mt-1 text-sm text-red-600/55">
                Actions here can have permanent consequences.
              </p>
            </div>

            <div className="flex flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div>
                <h3 className="text-sm font-black text-red-700">
                  Delete account
                </h3>

                <p className="mt-1 max-w-xl text-sm leading-6 text-red-600/55">
                  Permanently delete your LOFTY account and associated data.
                  This action cannot be undone.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeleteAccountOpen(true)
                  setDeleteAccountError(null)
                  setOwnedDesktops([])
                }}
                className="inline-flex w-fit shrink-0 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2.5 text-sm font-bold text-red-600 transition hover:bg-red-500/10"
              >
                Delete account
              </button>
            </div>
          </section>
        </div>
      </main>

      {/* Delete account modal */}
      {deleteAccountOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !deletingAccount) {
              setDeleteAccountOpen(false)
            }
          }}
        >
          <div className="w-full max-w-lg rounded-[28px] border border-black/10 bg-white p-7 shadow-2xl">
            <h2 className="text-2xl font-black tracking-tight">
              Delete your account?
            </h2>

            <p className="mt-3 text-sm leading-6 text-black/50">
              This will permanently delete your LOFTY account and sign you out.
              This action cannot be undone.
            </p>

            <div className="mt-6 rounded-2xl border border-red-500/15 bg-red-50/60 p-4">
              <p className="text-sm font-bold text-red-700">
                Before you continue
              </p>

              <p className="mt-1 text-sm leading-6 text-red-600/60">
                Any desktops you own must first be transferred to another member
                or deleted.
              </p>
            </div>

            {deleteAccountError && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                <p>{deleteAccountError}</p>
              </div>
            )}

            {ownedDesktops.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-black/35">
                  Desktops you own
                </p>

                <div className="mt-3 space-y-3">
                  {ownedDesktops.map((desktop) => (
                    <div
                      key={desktop.id}
                      className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-lofty-bg/70 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black">
                          {desktop.name}
                        </p>

                        <p className="mt-1 text-xs text-black/40">
                          You are the owner
                        </p>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() => void openTransferModal(desktop)}
                          disabled={deletingDesktopId === desktop.id}
                          className="rounded-xl border border-lofty-blue/20 bg-lofty-blue/5 px-3 py-2 text-xs font-black text-lofty-blue transition hover:bg-lofty-blue/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Transfer
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDeleteOwnedDesktop(desktop)}
                          disabled={deletingDesktopId === desktop.id}
                          className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {deletingDesktopId === desktop.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteAccountOpen(false)}
                disabled={deletingAccount}
                className="rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-bold text-black/55 transition hover:bg-black/3 disabled:opacity-40"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => void handleDeleteAccount()}
                disabled={deletingAccount || ownedDesktops.length > 0}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deletingAccount ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer ownership modal */}
      {transferDesktopTarget && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/35 p-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !transferring) {
              closeTransferModal()
            }
          }}
        >
          <div className="w-full max-w-lg overflow-hidden rounded-[28px] border border-black/10 bg-white shadow-2xl">
            <div className="border-b border-black/10 px-6 py-5">
              <h2 className="text-xl font-black tracking-tight">
                Transfer ownership
              </h2>

              <p className="mt-1.5 text-sm leading-6 text-black/45">
                Choose a member to become the owner of{" "}
                <span className="font-bold text-black/65">
                  {transferDesktopTarget.name}
                </span>
                .
              </p>
            </div>

            <div className="p-6">
              {loadingTransferMembers && (
                <div className="rounded-2xl border border-black/10 bg-lofty-bg/70 p-5 text-center">
                  <p className="text-sm font-bold text-black/45">
                    Loading members...
                  </p>
                </div>
              )}

              {!loadingTransferMembers &&
                transferMembers.length === 0 &&
                !transferError && (
                  <div className="rounded-2xl border border-black/10 bg-lofty-bg/70 p-5">
                    <p className="text-sm font-black">No other members</p>

                    <p className="mt-1 text-sm leading-6 text-black/40">
                      This desktop has no other members to transfer ownership
                      to. You will need to delete the desktop instead.
                    </p>
                  </div>
                )}

              {!loadingTransferMembers && transferMembers.length > 0 && (
                <>
                  <label
                    htmlFor="transfer-member"
                    className="mb-2 block text-sm font-bold text-black/65"
                  >
                    New owner
                  </label>

                  <select
                    id="transfer-member"
                    value={transferUserId}
                    onChange={(event) => setTransferUserId(event.target.value)}
                    disabled={transferring}
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-lofty-ink outline-none transition focus:border-lofty-blue/50 focus:ring-4 focus:ring-lofty-blue/10"
                  >
                    <option value="">Select a member...</option>

                    {transferMembers.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.name} — {member.email} ({member.role})
                      </option>
                    ))}
                  </select>

                  <div className="mt-4 rounded-xl border border-lofty-blue/15 bg-lofty-blue/5 px-4 py-3">
                    <p className="text-xs leading-5 text-black/50">
                      Ownership will be transferred immediately. You will become
                      an editor and will no longer be responsible for this
                      desktop.
                    </p>
                  </div>
                </>
              )}

              {transferError && (
                <div className="mt-4 rounded-xl border border-red-500/20 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {transferError}
                </div>
              )}

              <div className="mt-7 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeTransferModal}
                  disabled={transferring}
                  className="rounded-xl px-4 py-2.5 text-sm font-bold text-black/40 transition hover:bg-black/5 hover:text-lofty-ink disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Cancel
                </button>

                {transferMembers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleTransferOwnership()}
                    disabled={
                      transferring || loadingTransferMembers || !transferUserId
                    }
                    className="rounded-xl bg-lofty-ink px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {transferring ? "Transferring..." : "Transfer ownership"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
