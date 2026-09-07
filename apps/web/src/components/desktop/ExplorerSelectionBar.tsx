import type { FileItem, Folder } from "../../api/files"

type SelectedItem =
  | {
      type: "folder"
      item: Folder
    }
  | {
      type: "file"
      item: FileItem
    }

type ExplorerSelectionBarProps = {
  selectedItem: SelectedItem

  onOpenFile: (file: FileItem) => void
  onDownloadFile: (file: FileItem) => void

  onRename: () => void
  onDelete: () => void
}

export function ExplorerSelectionBar({
  selectedItem,
  onOpenFile,
  onDownloadFile,
  onRename,
  onDelete,
}: ExplorerSelectionBarProps) {
  return (
    <div className="flex shrink-0 items-center justify-between border-t border-white/10 bg-white/[0.04] px-4 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span>{selectedItem.type === "folder" ? "📁" : "📄"}</span>

        <span className="truncate text-sm">{selectedItem.item.name}</span>
      </div>

      <div className="flex items-center gap-2">
        {selectedItem.type === "file" && (
          <>
            <button
              type="button"
              onClick={() => onOpenFile(selectedItem.item)}
              className="rounded border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10"
            >
              Open
            </button>

            <button
              type="button"
              onClick={() => onDownloadFile(selectedItem.item)}
              className="rounded border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10"
            >
              Download
            </button>
          </>
        )}

        <button
          type="button"
          onClick={onRename}
          className="rounded border border-white/10 px-3 py-1.5 text-xs hover:bg-white/10"
        >
          Rename
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="rounded border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
        >
          Delete
        </button>
      </div>
    </div>
  )
}
