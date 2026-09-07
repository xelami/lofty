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

type RenameModalProps = {
  open: boolean
  selectedItem: SelectedItem
  renameValue: string
  actionLoading: boolean

  onValueChange: (value: string) => void
  onSubmit: (event: React.FormEvent) => void
  onClose: () => void
}

export function RenameModal({
  open,
  selectedItem,
  renameValue,
  actionLoading,
  onValueChange,
  onSubmit,
  onClose,
}: RenameModalProps) {
  if (!open || !selectedItem) {
    return null
  }

  return (
    <div
      className="absolute inset-0 z-[150] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={onSubmit}
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-lg border border-white/20 bg-slate-900 p-6 text-white shadow-2xl"
      >
        <h2 className="text-lg font-semibold">Rename</h2>

        <p className="mt-1 text-sm text-slate-500">
          Rename{" "}
          <span className="text-slate-300">{selectedItem.item.name}</span>.
        </p>

        <input
          autoFocus
          value={renameValue}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder="Name"
          className="mt-5 w-full rounded border border-white/10 bg-black/20 px-3 py-2.5 text-sm outline-none focus:border-white/30"
        />

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={actionLoading || !renameValue.trim()}
            className="rounded bg-white px-4 py-2 text-sm font-medium text-slate-950 disabled:opacity-50"
          >
            {actionLoading ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  )
}
