import type { Desktop } from "../../api/desktops"

type DesktopStartMenuProps = {
  desktop: Desktop | null
  open: boolean
  onClose: () => void
  onOpenExplorer: () => void
  onPersonalize: () => void
  onRefresh: () => void
}

export function DesktopStartMenu({
  desktop,
  open,
  onClose,
  onOpenExplorer,
  onPersonalize,
  onRefresh,
}: DesktopStartMenuProps) {
  if (!open) return null

  return (
    <div
      className="absolute bottom-12 left-2 z-[160] w-72 overflow-hidden rounded-lg border border-white/20 bg-black/80 text-white shadow-2xl backdrop-blur-xl"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      {/* Header */}
      <div className="border-b border-white/10 px-4 py-4">
        <div className="text-sm font-medium">{desktop?.name ?? "Desktop"}</div>

        <div className="mt-1 text-xs text-white/50">
          {desktop?.role === "owner"
            ? "Owner"
            : desktop?.role === "editor"
              ? "Editor"
              : "Viewer"}
        </div>
      </div>

      {/* Menu */}
      <div className="p-1">
        <button
          type="button"
          onClick={() => {
            onClose()
            onOpenExplorer()
          }}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm hover:bg-white/10"
        >
          📁
          <span>File Explorer</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose()
            onPersonalize()
          }}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm hover:bg-white/10"
        >
          🎨
          <span>Personalize</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose()
            onRefresh()
          }}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm hover:bg-white/10"
        >
          ↻<span>Refresh</span>
        </button>
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 px-4 py-2 text-xs text-white/40">
        LOFTY
      </div>
    </div>
  )
}
