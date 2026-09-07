import { useEffect, useState } from "react"

type DesktopTaskbarProps = {
  taskbarStyle: "classic" | "floating" | "minimal"
  taskbarPosition: "bottom" | "top"

  showClock: boolean

  startOpen: boolean
  onToggleStart: () => void

  explorerOpen: boolean
  explorerMinimized: boolean
  onToggleExplorer: () => void
}

export function DesktopTaskbar({
  taskbarStyle,
  taskbarPosition,
  showClock,
  startOpen,
  onToggleStart,
  explorerOpen,
  explorerMinimized,
  onToggleExplorer,
}: DesktopTaskbarProps) {
  const [time, setTime] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => window.clearInterval(interval)
  }, [])

  const clock = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })

  const date = time.toLocaleDateString([], {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  })

  const positionClass = taskbarPosition === "top" ? "top-0" : "bottom-0"

  const styleClass =
    taskbarStyle === "floating"
      ? "left-2 right-2 bottom-2 rounded-lg"
      : taskbarStyle === "minimal"
        ? "left-0 right-0"
        : "left-0 right-0"

  return (
    <div
      className={`absolute z-[150] ${positionClass} ${styleClass} flex h-12 items-center border border-white/20 bg-black/70 px-2 text-white shadow-lg backdrop-blur-xl`}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {/* Start */}
      <button
        type="button"
        onClick={onToggleStart}
        className={`flex h-9 items-center gap-2 rounded px-3 text-sm font-medium transition ${
          startOpen ? "bg-white/20" : "hover:bg-white/10"
        }`}
      >
        <span className="text-base">⊞</span>
        <span>Start</span>
      </button>

      {/* Divider */}
      <div className="mx-2 h-7 w-px bg-white/15" />

      {/* Open windows */}
      <div className="flex min-w-0 flex-1 items-center gap-1">
        {explorerOpen && (
          <button
            type="button"
            onClick={onToggleExplorer}
            className={`flex h-9 max-w-56 items-center gap-2 rounded px-3 text-sm ${
              !explorerMinimized ? "bg-white/15" : "hover:bg-white/10"
            }`}
          >
            <span>📁</span>

            <span className="truncate">Explorer</span>
          </button>
        )}
      </div>

      {/* Clock */}
      {showClock && (
        <div className="flex h-9 flex-col items-end justify-center px-3 text-right text-xs leading-tight">
          <span>{clock}</span>
          <span className="text-white/50">{date}</span>
        </div>
      )}
    </div>
  )
}
