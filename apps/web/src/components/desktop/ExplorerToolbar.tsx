import type { Desktop } from "../../api/desktops"
import type { Folder } from "../../api/files"

import { FileUpload } from "../FileUpload"

type ExplorerToolbarProps = {
  desktop: Desktop
  desktopId: string | undefined

  currentFolder: Folder | null
  folderPath: Folder[]

  onGoToRoot: () => void
  onGoToBreadcrumb: (index: number) => void
  onCreateFolder: () => void

  onUploaded: () => void
}

export function ExplorerToolbar({
  desktop,
  desktopId,
  currentFolder,
  folderPath,
  onGoToRoot,
  onGoToBreadcrumb,
  onCreateFolder,
  onUploaded,
}: ExplorerToolbarProps) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-white/[0.03] px-3 py-2">
      <button
        type="button"
        onClick={onGoToRoot}
        className="rounded px-2 py-1 text-sm text-slate-300 hover:bg-white/10"
      >
        ←
      </button>

      <div className="flex min-w-0 flex-1 items-center rounded border border-white/10 bg-black/20 px-3 py-1.5 text-xs text-slate-400">
        <button
          type="button"
          onClick={onGoToRoot}
          className="shrink-0 hover:text-white"
        >
          🖥️ {desktop.name ?? "Computer"}
        </button>

        {folderPath.map((folder, index) => (
          <span key={folder.id} className="flex min-w-0 items-center">
            <span className="px-2 text-slate-600">›</span>

            <button
              type="button"
              onClick={() => onGoToBreadcrumb(index)}
              className="truncate hover:text-white"
            >
              {folder.name}
            </button>
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onCreateFolder}
        className="rounded border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 hover:text-white"
      >
        + New folder
      </button>

      {desktopId && (
        <FileUpload
          desktopId={desktopId}
          folderId={currentFolder?.id}
          onUploaded={onUploaded}
        />
      )}
    </div>
  )
}
