import { useState } from "react"
import { Link } from "react-router-dom"

import { Navbar } from "../components/Navbar"
import { useAuthStore } from "../auth/authStore"

const API_URL = import.meta.env.VITE_API_URL

export function ResetPasswordPage() {
  const user = useAuthStore((state) => state.user)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [changingPassword, setChangingPassword] = useState(false)
  const [confirmationRequired, setConfirmationRequired] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!user?.hasPassword) {
      return
    }

    if (!currentPassword) {
      setError("Enter your current password")
      return
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters")
      return
    }

    if (newPassword.length > 128) {
      setError("New password must be no more than 128 characters")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match")
      return
    }

    if (currentPassword === newPassword) {
      setError("New password must be different from your current password")
      return
    }

    try {
      setChangingPassword(true)
      setConfirmationRequired(false)
      setError(null)

      const response = await fetch(`${API_URL}/profiles/change-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const data = (await response.json().catch(() => null)) as {
        success?: boolean
        confirmationRequired?: boolean
        error?: string
      } | null

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to request password change")
      }

      if (data?.confirmationRequired !== true) {
        throw new Error("Invalid response from server")
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setConfirmationRequired(true)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to request password change",
      )
    } finally {
      setChangingPassword(false)
    }
  }

  if (!user?.hasPassword) {
    return (
      <div className="min-h-screen bg-lofty-bg text-lofty-ink">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-lofty-pink opacity-25 blur-3xl" />
          <div className="absolute right-0 top-32 h-96 w-96 rounded-full bg-lofty-sky opacity-30 blur-3xl" />
        </div>

        <Navbar />

        <main className="relative mx-auto max-w-2xl px-5 py-10 sm:px-6 sm:py-14">
          <div className="rounded-[28px] border border-black/10 bg-white/65 p-7 shadow-sm backdrop-blur-xl sm:p-10">
            <div className="mb-6 text-4xl">🔒</div>

            <h1 className="text-3xl font-black tracking-[-0.05em]">
              Password unavailable
            </h1>

            <p className="mt-3 text-sm leading-6 text-black/45">
              This account does not currently have a password. If you signed up
              with Google, password management is handled by your sign-in
              provider.
            </p>

            <div className="mt-8">
              <Link
                to="/settings"
                className="inline-flex rounded-xl bg-lofty-ink px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5"
              >
                Back to settings
              </Link>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-lofty-bg text-lofty-ink">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-lofty-pink opacity-25 blur-3xl" />
        <div className="absolute right-0 top-32 h-96 w-96 rounded-full bg-lofty-sky opacity-30 blur-3xl" />
      </div>

      <Navbar />

      <main className="relative mx-auto max-w-2xl px-5 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-black/30">
            <Link to="/settings" className="transition hover:text-black/60">
              Settings
            </Link>

            <span className="text-black/15">/</span>

            <span className="text-black/50">Change password</span>
          </div>

          <h1 className="text-4xl font-black tracking-[-0.06em] sm:text-5xl">
            Change password
          </h1>

          <p className="mt-3 text-sm leading-6 text-black/45 sm:text-base">
            Choose a new password for your LOFTY account.
          </p>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-black/10 bg-white/65 shadow-sm backdrop-blur-xl">
          {confirmationRequired ? (
            <div className="px-6 py-8 sm:px-8 sm:py-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lofty-blue/10 text-2xl">
                ✉
              </div>

              <h2 className="mt-6 text-2xl font-black tracking-tight">
                Check your email
              </h2>

              <p className="mt-3 text-sm leading-6 text-black/45">
                We've sent a confirmation link to{" "}
                <span className="font-bold text-black/65">{user.email}</span>.
              </p>

              <p className="mt-3 text-sm leading-6 text-black/45">
                Your password has <span className="font-bold">not</span> been
                changed yet. Click the link in the email to confirm the change.
              </p>

              <p className="mt-5 text-xs leading-5 text-black/30">
                The confirmation link expires after 1 hour. For your security,
                you'll be signed out of your other sessions after the password
                change is confirmed.
              </p>

              <div className="mt-8">
                <Link
                  to="/settings"
                  className="inline-flex rounded-xl border border-black/10 bg-white/60 px-5 py-2.5 text-sm font-bold text-black/55 transition hover:bg-white hover:text-lofty-ink"
                >
                  Back to settings
                </Link>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleChangePassword}
              className="px-6 py-7 sm:px-8 sm:py-8"
            >
              <div className="grid gap-5">
                <div>
                  <label
                    htmlFor="current-password"
                    className="mb-2 block text-sm font-bold text-black/65"
                  >
                    Current password
                  </label>

                  <div className="relative">
                    <input
                      id="current-password"
                      name="current-password"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(event) => {
                        setCurrentPassword(event.target.value)
                        setError(null)
                      }}
                      disabled={changingPassword}
                      autoComplete="current-password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 pr-16 text-sm text-lofty-ink outline-none transition placeholder:text-black/25 focus:border-lofty-blue/50 focus:bg-white focus:ring-4 focus:ring-lofty-blue/10 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-black/35 hover:text-black/60"
                    >
                      {showCurrentPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div className="my-1 border-t border-black/5" />

                <div>
                  <label
                    htmlFor="new-password"
                    className="mb-2 block text-sm font-bold text-black/65"
                  >
                    New password
                  </label>

                  <div className="relative">
                    <input
                      id="new-password"
                      name="new-password"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(event) => {
                        setNewPassword(event.target.value)
                        setError(null)
                      }}
                      disabled={changingPassword}
                      autoComplete="new-password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      minLength={8}
                      maxLength={128}
                      className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 pr-16 text-sm text-lofty-ink outline-none transition placeholder:text-black/25 focus:border-lofty-blue/50 focus:bg-white focus:ring-4 focus:ring-lofty-blue/10 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-black/35 hover:text-black/60"
                    >
                      {showNewPassword ? "Hide" : "Show"}
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-black/30">
                    Must be between 8 and 128 characters.
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-bold text-black/65"
                  >
                    Confirm new password
                  </label>

                  <div className="relative">
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(event) => {
                        setConfirmPassword(event.target.value)
                        setError(null)
                      }}
                      disabled={changingPassword}
                      autoComplete="new-password"
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      minLength={8}
                      maxLength={128}
                      className="w-full rounded-xl border border-black/10 bg-white/70 px-4 py-3 pr-16 text-sm text-lofty-ink outline-none transition placeholder:text-black/25 focus:border-lofty-blue/50 focus:bg-white focus:ring-4 focus:ring-lofty-blue/10 disabled:cursor-not-allowed disabled:opacity-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-black/35 hover:text-black/60"
                    >
                      {showConfirmPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-500/20 bg-red-50/70 px-4 py-3 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              <div className="mt-7 rounded-xl border border-lofty-blue/15 bg-lofty-blue/5 px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 font-black text-lofty-ink">ⓘ</span>

                  <p className="text-xs leading-5 text-black/45">
                    For your security, we'll send a confirmation link to your
                    account email before your password is changed.
                  </p>
                </div>
              </div>

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  to="/settings"
                  className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white/60 px-5 py-2.5 text-sm font-bold text-black/50 transition hover:bg-white hover:text-lofty-ink"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={
                    changingPassword ||
                    !currentPassword ||
                    !newPassword ||
                    !confirmPassword
                  }
                  className="rounded-xl bg-lofty-ink px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {changingPassword ? "Sending confirmation..." : "Continue"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  )
}
