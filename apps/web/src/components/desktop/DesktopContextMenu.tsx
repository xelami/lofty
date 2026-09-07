import type { Desktop } from "../../api/desktops"

type DesktopContextMenuProps = {
  x: number
  y: number
  desktop: Desktop | null
  onClose: () => void
  onCreateFolder: () => void
  onArrange: (sortBy: "name" | "type") => void
  onOpenExplorer: () => void
  onRefresh: () => void
  onPersonalize: () => void
}

export function DesktopContextMenu({
  x,
  y,
  desktop,
  onClose,
  onCreateFolder,
  onArrange,
  onOpenExplorer,
  onRefresh,
  onPersonalize,
}: DesktopContextMenuProps) {
  return (
    <div
      className="absolute z-[200] min-w-48 overflow-hidden rounded-md border border-white/20 bg-black/80 p-1 text-white shadow-2xl backdrop-blur-xl"
      style={{
        left: x,
        top: y,
      }}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <button
        type="button"
        disabled={desktop?.role === "viewer"}
        onClick={() => {
          if (desktop?.role === "viewer") return

          onClose()
          onCreateFolder()
        }}
        className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        📁 New folder
      </button>

      <button
        type="button"
        disabled={desktop?.role === "viewer"}
        onClick={() => {
          if (desktop?.role === "viewer") return

          onClose()
          onArrange("name")
        }}
        className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ↕ Arrange icons
      </button>

      <button
        type="button"
        disabled={desktop?.role === "viewer"}
        onClick={() => {
          if (desktop?.role === "viewer") return

          onClose()
          onArrange("type")
        }}
        className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        🔤 Sort by type
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        type="button"
        onClick={() => {
          onClose()
          onOpenExplorer()
        }}
        className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-white/10"
      >
        🖥️ Open Explorer
      </button>

      <button
        type="button"
        onClick={() => {
          onClose()
          onPersonalize()
        }}
        className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-white/10"
      >
        🎨 Personalize
      </button>

      <button
        type="button"
        onClick={() => {
          onClose()
          onRefresh()
        }}
        className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-white/10"
      >
        ↻ Refresh
      </button>
    </div>
  )
}
