import type { CSSProperties } from "react"
import type { Desktop } from "../../api/desktops"
import type { FileItem, Folder } from "../../api/files"
import { ExplorerToolbar } from "./ExplorerToolbar"
import { ExplorerSelectionBar } from "./ExplorerSelectionBar"
import { ExplorerContent } from "./ExplorerContent"

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

type ExplorerWindowProps = {
  desktop: Desktop
  desktopId: string | undefined

  explorerOpen: boolean
  explorerMinimized: boolean

  currentFolder: Folder | null
  folderPath: Folder[]

  folders: Folder[]
  files: FileItem[]

  loading: boolean
  selectedItem: SelectedItem

  windowStyle: CSSProperties

  onMinimize: () => void
  onClose: () => void

  onGoToRoot: () => void
  onGoToBreadcrumb: (index: number) => void
  onCreateFolder: () => void

  onUploaded: () => void

  onSelectItem: (item: Exclude<SelectedItem, null>) => void
  onOpenFolder: (folder: Folder) => void
  onOpenFile: (file: FileItem) => void
  onDownloadFile: (file: FileItem) => void

  onRename: () => void
  onDelete: () => void

  formatFileSize: (size: number) => string
}

export function ExplorerWindow({
  desktop,
  desktopId,
  explorerOpen,
  explorerMinimized,
  currentFolder,
  folderPath,
  folders,
  files,
  loading,
  selectedItem,
  windowStyle,
  onMinimize,
  onClose,
  onGoToRoot,
  onGoToBreadcrumb,
  onCreateFolder,
  onUploaded,
  onSelectItem,
  onOpenFolder,
  onOpenFile,
  onDownloadFile,
  onRename,
  onDelete,
  formatFileSize,
}: ExplorerWindowProps) {
  if (!explorerOpen || explorerMinimized) {
    return null
  }

  return (
    <div
      className="absolute left-1/2 top-[8%] z-40 flex h-[75vh] w-[85vw] max-w-6xl -translate-x-1/2 flex-col overflow-hidden rounded-lg border border-white/30 text-white shadow-2xl"
      style={windowStyle}
      onClick={(event) => event.stopPropagation()}
      onContextMenu={(event) => event.stopPropagation()}
    >
      {/* Title bar */}

      <div className="flex h-10 shrink-0 items-center border-b border-white/10 bg-white/[0.06]">
        <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
          <span className="text-lg">📁</span>

          <span className="truncate text-sm font-medium">
            {currentFolder?.name ?? desktop.name ?? "Computer"}
          </span>
        </div>

        <button
          type="button"
          onClick={onMinimize}
          className="flex h-10 w-12 items-center justify-center text-slate-300 hover:bg-white/10"
        >
          −
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-12 items-center justify-center text-slate-300 hover:bg-red-500/80 hover:text-white"
        >
          ×
        </button>
      </div>

      {/* Toolbar */}

      <ExplorerToolbar
        desktop={desktop}
        desktopId={desktopId}
        currentFolder={currentFolder}
        folderPath={folderPath}
        onGoToRoot={onGoToRoot}
        onGoToBreadcrumb={onGoToBreadcrumb}
        onCreateFolder={onCreateFolder}
        onUploaded={onUploaded}
      />

      {/* Explorer content */}

      <ExplorerContent
        desktop={desktop}
        folders={folders}
        files={files}
        loading={loading}
        selectedItem={selectedItem}
        onSelectItem={onSelectItem}
        onOpenFolder={onOpenFolder}
        onOpenFile={onOpenFile}
        formatFileSize={formatFileSize}
      />

      {/* Selection actions */}

      {selectedItem && (
        <ExplorerSelectionBar
          selectedItem={selectedItem}
          onOpenFile={onOpenFile}
          onDownloadFile={onDownloadFile}
          onRename={onRename}
          onDelete={onDelete}
        />
      )}
    </div>
  )
}
