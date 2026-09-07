import { useState } from "react"

import { useAuthStore } from "../auth/authStore"

export function LoginPage() {
  const login = useAuthStore((state) => state.login)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    setError(null)
    setSubmitting(true)

    try {
      await login(email, password)
    } catch (error) {
      setError(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

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
            Sign in to your desktop
          </p>
        </div>

        {/* Card */}

        <div className="rounded-[28px] border border-black/10 bg-white/70 p-6 shadow-[0_25px_60px_rgba(30,30,30,0.12)] backdrop-blur-xl sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-bold text-black/65">
                Email
              </label>

              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-black/10 bg-white/75 px-4 py-3 text-sm font-medium text-lofty-ink outline-none transition placeholder:text-black/25 focus:border-lofty-blue focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-black/65">
                Password
              </label>

              <div className="relative">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-black/10 bg-white/75 px-4 py-3 pr-20 text-sm font-medium text-lofty-ink outline-none transition placeholder:text-black/25 focus:border-lofty-blue focus:bg-white"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-bold text-black/35 transition hover:bg-black/5 hover:text-black/65"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <a
              href="https://api.lofty.social/v1/auth/google"
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-(--border) bg-white px-4 py-3.5 text-sm font-semibold text-slate-900 transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <span className="flex h-5 w-5 items-center justify-center text-sm font-bold">
                G
              </span>
              Continue with Google
            </a>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-lofty-ink px-4 py-3 font-bold text-white shadow-[4px_4px_0_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:shadow-[5px_5px_0_rgba(0,0,0,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Signing in..." : "Sign in →"}
            </button>
          </form>

          <div className="mt-6 border-t border-black/10 pt-6 text-center">
            <a
              href="/register"
              className="text-sm font-semibold text-black/45 transition hover:text-black"
            >
              Don't have an account?{" "}
              <span className="text-lofty-blue">Create one</span>
            </a>
          </div>
        </div>

        <p className="mt-8 text-center text-xs font-medium text-black/30">
          Your desktop. Your people. Your way of working.
        </p>
      </div>
    </main>
  )
}
