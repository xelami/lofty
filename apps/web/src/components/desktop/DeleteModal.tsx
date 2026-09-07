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
  | null

type DeleteModalProps = {
  open: boolean
  selectedItem: SelectedItem
  actionLoading: boolean

  onConfirm: () => void
  onClose: () => void
}

export function DeleteModal({
  open,
  selectedItem,
  actionLoading,
  onConfirm,
  onClose,
}: DeleteModalProps) {
  if (!open || !selectedItem) {
    return null
  }

  const itemType = selectedItem.type === "folder" ? "folder" : "file"

  return (
    <div
      className="absolute inset-0 z-[150] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-white/20 bg-slate-900 p-6 text-white shadow-2xl"
      >
        <h2 className="text-lg font-semibold">Delete {itemType}?</h2>

        <p className="mt-2 text-sm text-slate-400">
          Are you sure you want to delete{" "}
          <span className="font-medium text-slate-200">
            {selectedItem.item.name}
          </span>
          ?
        </p>

        <p className="mt-2 text-xs text-slate-500">
          This action cannot be undone.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={actionLoading}
            className="rounded bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
          >
            {actionLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}
