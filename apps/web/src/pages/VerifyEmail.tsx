import { useEffect, useRef, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"

import { apiFetch } from "../api/client"
import { useAuthStore } from "../auth/authStore"

export function VerifyEmail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const checkAuth = useAuthStore((state) => state.checkAuth)

  const hasVerified = useRef(false)

  const [status, setStatus] = useState<"verifying" | "success" | "error">(
    "verifying",
  )

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hasVerified.current) {
      return
    }

    const token = searchParams.get("token")

    if (token === null || token.length === 0) {
      setStatus("error")
      setError("This verification link is invalid or missing its token.")
      return
    }

    hasVerified.current = true

    async function verify() {
      try {
        //@ts-expect-error
        await apiFetch(`/auth/verify-email?token=${encodeURIComponent(token)}`)

        // The backend has now created the session cookie.
        // Load the authenticated user into the Zustand store.
        await checkAuth()

        setStatus("success")

        setTimeout(() => {
          navigate("/desktops", {
            replace: true,
          })
        }, 1000)
      } catch (err) {
        setStatus("error")

        setError(
          err instanceof Error
            ? err.message
            : "This verification link is invalid or has expired.",
        )
      }
    }

    void verify()
  }, [searchParams, navigate, checkAuth])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-lofty-bg px-6 py-12 text-lofty-ink">
      {/* Background atmosphere */}

      <div className="pointer-events-none absolute left-[10%] top-[15%] h-72 w-72 rounded-full bg-lofty-pink opacity-50 blur-3xl" />

      <div className="pointer-events-none absolute bottom-[5%] right-[5%] h-96 w-96 rounded-full bg-lofty-sky opacity-60 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-lofty-ink text-sm font-black text-white shadow-[4px_4px_0_rgba(0,0,0,0.12)]">
            L
          </div>

          <h1 className="text-3xl font-black tracking-tighter">LOFTY</h1>

          <p className="mt-2 text-sm font-medium text-black/45">
            Email verification
          </p>
        </div>

        {/* Card */}

        <div className="rounded-[28px] border border-black/10 bg-white/70 p-7 text-center shadow-[0_25px_60px_rgba(30,30,30,0.12)] backdrop-blur-xl">
          {/* VERIFYING */}

          {status === "verifying" && (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-black/10 bg-lofty-bg">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-black/10 border-t-lofty-blue" />
              </div>

              <h2 className="text-xl font-black tracking-tight">
                Verifying your email
              </h2>

              <p className="mt-3 text-sm leading-6 text-black/45">
                Please wait while we activate your account.
              </p>
            </>
          )}

          {/* SUCCESS */}

          {status === "success" && (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#72c48b]/15 text-2xl font-bold text-[#4e9b67]">
                ✓
              </div>

              <h2 className="text-xl font-black tracking-tight">
                Email verified
              </h2>

              <p className="mt-3 text-sm leading-6 text-black/45">
                Your account has been verified and you're now signed in.
              </p>

              <p className="mt-3 text-xs font-medium text-black/30">
                Redirecting you to LOFTY...
              </p>
            </>
          )}

          {/* ERROR */}

          {status === "error" && (
            <>
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-2xl font-bold text-red-500">
                !
              </div>

              <h2 className="text-xl font-black tracking-tight">
                Verification failed
              </h2>

              <p className="mt-3 text-sm leading-6 text-black/45">{error}</p>

              <p className="mt-4 text-xs leading-5 text-black/30">
                The link may have expired or already been used.
              </p>

              <button
                type="button"
                onClick={() => navigate("/login")}
                className="mt-6 w-full rounded-xl bg-lofty-ink px-4 py-3 font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5"
              >
                Back to sign in
              </button>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-xs font-medium text-black/30">
          Your desktop. Your people. Your way of working.
        </p>
      </div>
    </main>
  )
}
