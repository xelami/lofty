import type { FileItem, Folder } from "../../api/files"
import type { Desktop } from "../../api/desktops"

type FileContextMenuProps = {
  x: number
  y: number
  type: "folder" | "file"
  folder?: Folder
  file?: FileItem
  desktop: Desktop | null
  onClose: () => void
  onOpen: () => void
  onProperties: () => void
  onRename: () => void
  onDelete: () => void
}

export function FileContextMenu({
  x,
  y,
  type,
  folder,
  file,
  desktop,
  onClose,
  onOpen,
  onProperties,
  onRename,
  onDelete,
}: FileContextMenuProps) {
  const itemName = type === "folder" ? folder?.name : file?.name

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
      <div className="border-b border-white/10 px-3 py-2">
        <div className="truncate text-xs text-white/50">
          {type === "folder" ? "Folder" : "File"}
        </div>

        <div className="max-w-56 truncate text-sm">{itemName}</div>
      </div>

      <button
        type="button"
        onClick={() => {
          onClose()
          onOpen()
        }}
        className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-white/10"
      >
        {type === "folder" ? "📂" : "📄"} Open
      </button>

      <button
        type="button"
        onClick={() => {
          onClose()
          onProperties()
        }}
        className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-white/10"
      >
        ℹ️ Properties
      </button>

      <div className="my-1 border-t border-white/10" />

      <button
        type="button"
        disabled={desktop?.role === "viewer"}
        onClick={() => {
          if (desktop?.role === "viewer") return

          onClose()
          onRename()
        }}
        className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        ✏️ Rename
      </button>

      <button
        type="button"
        disabled={desktop?.role === "viewer"}
        onClick={() => {
          if (desktop?.role === "viewer") return

          onClose()
          onDelete()
        }}
        className="flex w-full items-center gap-3 rounded px-3 py-2 text-left text-sm text-red-300 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        🗑️ Delete
      </button>
    </div>
  )
}
