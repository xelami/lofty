import { useState } from "react"
import { Link, useSearchParams, useNavigate } from "react-router-dom"

import { Navbar } from "../components/Navbar"

const API_URL = import.meta.env.VITE_API_URL

export function VerifyPasswordChangePage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const token = searchParams.get("token")

  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(
    token ? null : "This password change link is invalid.",
  )

  async function handleConfirm() {
    if (!token || confirming) return

    setConfirming(true)
    setError(null)

    try {
      const response = await fetch(`${API_URL}/auth/confirm-password-change`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ token }),
      })

      const text = await response.text()

      let data: {
        success?: boolean
        message?: string
        error?: string
      } = {}

      try {
        data = JSON.parse(text)
      } catch {
        // Ignore invalid JSON.
      }

      if (!response.ok) {
        throw new Error(
          data.error || `Password confirmation failed (${response.status})`,
        )
      }

      if (data.success !== true) {
        throw new Error(data.message || "Password confirmation failed")
      }

      setConfirmed(true)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Password confirmation failed",
      )
    } finally {
      setConfirming(false)
    }
  }

  if (confirmed) {
    return (
      <div className="min-h-screen bg-lofty-bg text-lofty-ink">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-lofty-pink opacity-25 blur-3xl" />
          <div className="absolute right-0 top-32 h-96 w-96 rounded-full bg-lofty-sky opacity-30 blur-3xl" />
        </div>

        <Navbar />

        <main className="relative mx-auto max-w-2xl px-5 py-10 sm:px-6 sm:py-14">
          <section className="overflow-hidden rounded-[28px] border border-black/10 bg-white/65 shadow-sm backdrop-blur-xl">
            <div className="px-6 py-8 sm:px-8 sm:py-10">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#72c48b]/10 text-2xl">
                ✓
              </div>

              <h1 className="mt-6 text-3xl font-black tracking-[-0.05em]">
                Password changed
              </h1>

              <p className="mt-3 text-sm leading-6 text-black/45">
                Your LOFTY password has been changed successfully.
              </p>

              <p className="mt-3 text-sm leading-6 text-black/45">
                All existing sessions have been signed out. Log in again using
                your new password.
              </p>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="inline-flex rounded-xl bg-lofty-ink px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5"
                >
                  Log in
                </button>
              </div>
            </div>
          </section>
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
            <Link to="/login" className="transition hover:text-black/60">
              LOFTY
            </Link>

            <span className="text-black/15">/</span>

            <span className="text-black/50">Password confirmation</span>
          </div>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-black/10 bg-white/65 shadow-sm backdrop-blur-xl">
          <div className="px-6 py-8 sm:px-8 sm:py-10">
            {error ? (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-xl font-black text-red-600">
                  !
                </div>

                <h1 className="mt-6 text-3xl font-black tracking-[-0.05em]">
                  Password change unavailable
                </h1>

                <p className="mt-3 text-sm leading-6 text-black/45">{error}</p>

                <p className="mt-3 text-sm leading-6 text-black/45">
                  Password change links expire after 1 hour and can only be used
                  once.
                </p>

                <div className="mt-8">
                  <Link
                    to="/change-password"
                    className="inline-flex rounded-xl bg-lofty-ink px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5"
                  >
                    Request a new link
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lofty-blue/10 text-2xl">
                  🔐
                </div>

                <h1 className="mt-6 text-3xl font-black tracking-[-0.05em]">
                  Confirm password change
                </h1>

                <p className="mt-3 text-sm leading-6 text-black/45">
                  You're about to change the password for your LOFTY account.
                </p>

                <div className="mt-6 rounded-xl border border-lofty-blue/15 bg-lofty-blue/5 px-4 py-3">
                  <p className="text-xs leading-5 text-black/45">
                    Confirming this change will sign out all existing sessions.
                    You'll need to log in again with your new password.
                  </p>
                </div>

                <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-xl border border-black/10 bg-white/60 px-5 py-2.5 text-sm font-bold text-black/50 transition hover:bg-white hover:text-lofty-ink"
                  >
                    Cancel
                  </Link>

                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="inline-flex items-center justify-center rounded-xl bg-lofty-ink px-5 py-2.5 text-sm font-bold text-white shadow-[3px_3px_0_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {confirming ? "Confirming..." : "Confirm password change"}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
