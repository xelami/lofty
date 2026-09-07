import type { Desktop } from "../../api/desktops"
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

type ExplorerContentProps = {
  desktop: Desktop

  folders: Folder[]
  files: FileItem[]

  loading: boolean
  selectedItem: SelectedItem

  onSelectItem: (item: Exclude<SelectedItem, null>) => void
  onOpenFolder: (folder: Folder) => void
  onOpenFile: (file: FileItem) => void

  formatFileSize: (size: number) => string
}

export function ExplorerContent({
  desktop,
  folders,
  files,
  loading,
  selectedItem,
  onSelectItem,
  onOpenFolder,
  onOpenFile,
  formatFileSize,
}: ExplorerContentProps) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      {loading ? (
        <div className="flex h-full items-center justify-center text-sm text-slate-500">
          Loading...
        </div>
      ) : folders.length === 0 && files.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="mb-4 text-6xl">📂</div>

          <h2 className="font-medium">This folder is empty</h2>

          <p className="mt-2 text-sm text-slate-500">
            Create a folder or upload a file to get started.
          </p>
        </div>
      ) : (
        <div className="p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_140px_120px_150px] border-b border-white/10 px-3 py-2 text-xs uppercase tracking-wider text-slate-500">
            <span>Name</span>
            <span>Type</span>
            <span>Size</span>
            <span>Modified</span>
          </div>

          {folders.map((folder) => {
            const isSelected =
              selectedItem?.type === "folder" &&
              selectedItem.item.id === folder.id

            return (
              <button
                key={folder.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()

                  onSelectItem({
                    type: "folder",
                    item: folder,
                  })
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation()
                  onOpenFolder(folder)
                }}
                className="grid w-full grid-cols-[minmax(0,1fr)_140px_120px_150px] items-center rounded px-3 py-2 text-left text-sm hover:bg-white/5"
                style={
                  isSelected
                    ? {
                        backgroundColor: `${desktop.settings.theme.accentColor}33`,
                      }
                    : undefined
                }
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-2xl">📁</span>

                  <span className="truncate">{folder.name}</span>
                </div>

                <span className="text-slate-500">Folder</span>

                <span className="text-slate-600">—</span>

                <span className="text-slate-500">
                  {new Date(folder.updatedAt).toLocaleDateString()}
                </span>
              </button>
            )
          })}

          {files.map((file) => {
            const isSelected =
              selectedItem?.type === "file" && selectedItem.item.id === file.id

            return (
              <button
                key={file.id}
                type="button"
                onClick={(event) => {
                  event.stopPropagation()

                  onSelectItem({
                    type: "file",
                    item: file,
                  })
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation()
                  onOpenFile(file)
                }}
                className="grid w-full grid-cols-[minmax(0,1fr)_140px_120px_150px] items-center rounded px-3 py-2 text-left text-sm hover:bg-white/5"
                style={
                  isSelected
                    ? {
                        backgroundColor: `${desktop.settings.theme.accentColor}33`,
                      }
                    : undefined
                }
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="text-2xl">📄</span>

                  <span className="truncate">{file.name}</span>
                </div>

                <span className="truncate text-slate-500">{file.mimeType}</span>

                <span className="text-slate-500">
                  {formatFileSize(file.size)}
                </span>

                <span className="text-slate-500">
                  {new Date(file.updatedAt).toLocaleDateString()}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
