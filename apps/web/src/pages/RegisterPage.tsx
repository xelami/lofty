import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { useAuthStore } from "../auth/authStore"

export function RegisterPage() {
  const register = useAuthStore((state) => state.register)
  const resendVerificationEmail = useAuthStore(
    (state) => state.resendVerificationEmail,
  )

  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [emailSent, setEmailSent] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendMessage, setResendMessage] = useState<string | null>(null)

  const passwordRequirements = [
    {
      label: "At least 8 characters",
      valid: password.length >= 8,
    },
    {
      label: "At least one number",
      valid: /\d/.test(password),
    },
    {
      label: "At least one special character",
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ]

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()

    setError(null)

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.")
      return
    }

    if (!/\d/.test(password)) {
      setError("Password must contain at least one number.")
      return
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      setError("Password must contain at least one special character.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setSubmitting(true)

    try {
      await register(name, email, password)

      setEmailSent(true)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleResend() {
    setError(null)
    setResendMessage(null)
    setResending(true)

    try {
      await resendVerificationEmail(email)

      setResendMessage("Verification email sent again.")
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to resend the verification email.",
      )
    } finally {
      setResending(false)
    }
  }

  if (emailSent) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-lofty-bg px-6 py-12 text-lofty-ink">
        {/* Background atmosphere */}

        <div className="pointer-events-none absolute left-[8%] top-[12%] h-72 w-72 rounded-full bg-lofty-pink opacity-50 blur-3xl" />

        <div className="pointer-events-none absolute bottom-[8%] right-[8%] h-80 w-80 rounded-full bg-lofty-blue-pale opacity-70 blur-3xl" />

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-50 blur-3xl" />

        <div className="relative w-full max-w-md">
          {/* Logo */}

          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-lofty-ink text-sm font-black text-white shadow-lofty-offset-sm">
              L
            </div>

            <h1 className="text-3xl font-black tracking-tighter">LOFTY</h1>

            <p className="mt-2 text-sm font-medium text-lofty-ink/45">
              One more step to get started
            </p>
          </div>

          {/* Card */}

          <div className="rounded-[28px] border border-lofty-border bg-lofty-surface/75 p-6 shadow-lofty-lg backdrop-blur-xl sm:p-7">
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-lofty-green/15 text-2xl text-lofty-green">
                ✓
              </div>

              <h2 className="text-xl font-black tracking-tight">
                Check your email
              </h2>

              <p className="mt-3 text-sm leading-6 text-lofty-ink/50">
                We've sent a verification link to
              </p>

              <p className="mt-1 break-all font-bold text-lofty-ink">{email}</p>

              <p className="mt-4 text-sm leading-6 text-lofty-ink/50">
                Click the link in the email to verify your address and activate
                your LOFTY account.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-lofty-border-soft bg-lofty-bg/70 px-4 py-3">
              <p className="text-xs leading-5 text-lofty-ink/40">
                Didn't receive it? Check your spam or junk folder. The
                verification link will expire after 24 hours.
              </p>
            </div>

            {resendMessage && (
              <div className="mt-4 rounded-xl border border-lofty-green/20 bg-lofty-green/10 px-3 py-2.5 text-sm font-medium text-lofty-green">
                {resendMessage}
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-xl border border-lofty-danger/20 bg-lofty-danger/10 px-3 py-2.5 text-sm font-medium text-lofty-danger">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="mt-6 w-full rounded-2xl bg-lofty-ink px-4 py-3 font-bold text-white shadow-lofty-offset-sm transition hover:-translate-y-0.5 hover:shadow-lofty-offset disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resending ? "Sending..." : "Resend verification email"}
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="mt-4 w-full text-sm font-semibold text-lofty-ink/45 transition hover:text-lofty-ink"
            >
              Back to sign in
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-lofty-bg px-6 py-12 text-lofty-ink">
      {/* Background atmosphere */}

      <div className="pointer-events-none absolute left-[5%] top-[10%] h-72 w-72 rounded-full bg-lofty-pink opacity-50 blur-3xl" />

      <div className="pointer-events-none absolute bottom-[5%] right-[5%] h-80 w-80 rounded-full bg-lofty-blue-pale opacity-70 blur-3xl" />

      <div className="pointer-events-none absolute right-[20%] top-[20%] h-48 w-48 rounded-full bg-lofty-lavender opacity-30 blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-[14px] bg-lofty-ink text-sm font-black text-white shadow-lofty-offset-sm">
            L
          </div>

          <h1 className="text-3xl font-black tracking-tighter">LOFTY</h1>

          <p className="mt-2 text-sm font-medium text-lofty-ink/45">
            Create your LOFTY account
          </p>
        </div>

        {/* Register card */}

        <div className="rounded-[28px] border border-lofty-border bg-lofty-surface/75 p-6 shadow-lofty-lg backdrop-blur-xl sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}

            <div>
              <label className="mb-2 block text-sm font-bold text-lofty-ink/65">
                Name
              </label>

              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Alex"
                type="text"
                required
                autoComplete="name"
                className="w-full rounded-xl border border-lofty-border bg-lofty-bg/70 px-3.5 py-3 text-sm font-medium text-lofty-ink outline-none transition placeholder:text-lofty-ink/25 focus:border-lofty-blue/50 focus:bg-white focus:ring-4 focus:ring-lofty-blue/10"
              />
            </div>

            {/* Email */}

            <div>
              <label className="mb-2 block text-sm font-bold text-lofty-ink/65">
                Email
              </label>

              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-xl border border-lofty-border bg-lofty-bg/70 px-3.5 py-3 text-sm font-medium text-lofty-ink outline-none transition placeholder:text-lofty-ink/25 focus:border-lofty-blue/50 focus:bg-white focus:ring-4 focus:ring-lofty-blue/10"
              />
            </div>

            {/* Password */}

            <div>
              <label className="mb-2 block text-sm font-bold text-lofty-ink/65">
                Password
              </label>

              <div className="relative">
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••••••"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-lofty-border bg-lofty-bg/70 px-3.5 py-3 pr-16 text-sm font-medium text-lofty-ink outline-none transition placeholder:text-lofty-ink/25 focus:border-lofty-blue/50 focus:bg-white focus:ring-4 focus:ring-lofty-blue/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-lofty-ink/35 transition hover:text-lofty-ink"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

              {/* Password requirements */}

              <div className="mt-3 space-y-1.5">
                {passwordRequirements.map((requirement) => (
                  <div
                    key={requirement.label}
                    className={`flex items-center gap-2 text-xs font-medium ${
                      requirement.valid
                        ? "text-lofty-green"
                        : "text-lofty-ink/35"
                    }`}
                  >
                    <span className="flex h-4 w-4 items-center justify-center">
                      {requirement.valid ? "✓" : "○"}
                    </span>

                    <span>{requirement.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirm password */}

            <div>
              <label className="mb-2 block text-sm font-bold text-lofty-ink/65">
                Confirm password
              </label>

              <div className="relative">
                <input
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  autoComplete="new-password"
                  className={`w-full rounded-xl border bg-lofty-bg/70 px-3.5 py-3 pr-16 text-sm font-medium text-lofty-ink outline-none transition placeholder:text-lofty-ink/25 focus:bg-white focus:ring-4 ${
                    confirmPassword.length > 0
                      ? passwordsMatch
                        ? "border-lofty-green/50 focus:border-lofty-green/60 focus:ring-lofty-green/10"
                        : "border-lofty-danger/50 focus:border-lofty-danger/60 focus:ring-lofty-danger/10"
                      : "border-lofty-border focus:border-lofty-blue/50 focus:ring-lofty-blue/10"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-lofty-ink/35 transition hover:text-lofty-ink"
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>

              {confirmPassword.length > 0 && (
                <p
                  className={`mt-1.5 text-xs font-medium ${
                    passwordsMatch ? "text-lofty-green" : "text-lofty-danger"
                  }`}
                >
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </p>
              )}
            </div>

            {/* Error */}

            {error && (
              <div className="rounded-xl border border-lofty-danger/20 bg-lofty-danger/10 px-3 py-2.5 text-sm font-medium text-lofty-danger">
                {error}
              </div>
            )}

            {/* Submit */}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-lofty-ink px-4 py-3 font-bold text-white shadow-lofty-offset-sm transition hover:-translate-y-0.5 hover:shadow-lofty-offset disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Creating account..." : "Create account →"}
            </button>
          </form>

          {/* Login */}

          <div className="mt-6 border-t border-lofty-border-soft pt-6 text-center">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm font-semibold text-lofty-ink/45 transition hover:text-lofty-ink"
            >
              Already have an account? Sign in
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs font-medium text-lofty-ink/25">
          Your desktop. Your people. Your way of working.
        </p>
      </div>
    </main>
  )
}
