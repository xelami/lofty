import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"

import { useAuthStore } from "../auth/authStore"

export function Navbar() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const [loggingOut, setLoggingOut] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [])

  async function handleLogout() {
    try {
      setLoggingOut(true)
      await logout()
    } catch {
      setLoggingOut(false)
    }
  }

  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "U"

  return (
    <header className="sticky top-0 z-30 border-b border-black/10 bg-lofty-bg/85 backdrop-blur-xl">
      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6">
        <Link to="/desktops" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-lofty-ink text-sm font-black text-white shadow-lofty-offset-sm">
            L
          </div>

          <span className="text-[15px] font-black tracking-[-0.04em]">
            LOFTY
          </span>
        </Link>

        <div ref={userMenuRef} className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((open) => !open)}
            aria-expanded={userMenuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-3 rounded-2xl border border-transparent px-2 py-1.5 transition hover:border-black/10 hover:bg-white/50"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold text-lofty-ink">
                {user?.name ?? "User"}
              </p>

              <p className="max-w-45 truncate text-xs text-black/40">
                {user?.email}
              </p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/70 text-xs font-black text-black/60 shadow-sm">
              {initials}
            </div>

            <svg
              className={`h-4 w-4 text-black/30 transition-transform ${
                userMenuOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {userMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-black/10 bg-lofty-bg/95 shadow-[0_20px_50px_rgba(20,20,20,0.15)] backdrop-blur-xl"
            >
              <div className="border-b border-black/10 px-4 py-3">
                <p className="truncate text-sm font-black text-lofty-ink">
                  {user?.name ?? "User"}
                </p>

                <p className="mt-0.5 truncate text-xs text-black/40">
                  {user?.email}
                </p>
              </div>

              <div className="p-1.5">
                <Link
                  to="/settings"
                  role="menuitem"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-black/55 transition hover:bg-black/5 hover:text-lofty-ink"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 text-base">
                    ⚙
                  </span>

                  <span>Settings</span>
                </Link>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => void handleLogout()}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-black/55 transition hover:bg-red-500/5 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/5 text-base">
                    ↪
                  </span>

                  <span>{loggingOut ? "Signing out..." : "Sign out"}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
