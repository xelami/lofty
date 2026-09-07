import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"

import { type FileItem, type Folder } from "../api/files"

import { type Desktop } from "../api/desktops"

// Hooks
import { useDesktopData } from "../hooks/desktop/useDesktopData"
import { useDesktopContents } from "../hooks/desktop/useDesktopContents"
import { useExplorer } from "../hooks/desktop/useExplorer"
import { useDesktopIcons } from "../hooks/desktop/useDesktopIcons"
import { useDesktopActions } from "../hooks/desktop/useDesktopActions"
import { useDesktopRealtime } from "../hooks/useDesktopRealtime"
import { useDesktopSettings } from "../hooks/useDesktopSettings"

// Components
import { ExplorerWindow } from "../components/desktop/ExplorerWindow"
import { DeleteModal } from "../components/desktop/DeleteModal"
import { RenameModal } from "../components/desktop/RenameModal"
import { CreateFolderModal } from "../components/desktop/CreateFolderModal"
import { DesktopSettings } from "../components/DesktopSettings"
import { DesktopCanvas } from "../components/desktop/DesktopCanvas"
import { DesktopContextMenu } from "../components/desktop/DesktopContextMenu"
import { FileContextMenu } from "../components/desktop/FileContextMenu"
import { DesktopTaskbar } from "../components/desktop/DesktopTaskbar"
import { DesktopStartMenu } from "../components/desktop/DesktopStartMenu"
import { DesktopCursors } from "../components/desktop/DesktopCursors"

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

type DesktopContextMenu =
  | {
      type: "desktop"
      x: number
      y: number
    }
  | {
      type: "folder"
      x: number
      y: number
      folder: Folder
    }
  | {
      type: "file"
      x: number
      y: number
      file: FileItem
    }
  | null

export function DesktopPage() {
  const { desktopId } = useParams<{
    desktopId: string
  }>()

  const { cursors, sendCursor, lastEvent } = useDesktopRealtime(desktopId)

  const {
    desktop,
    setDesktop,
    desktopFolders,
    setDesktopFolders,
    desktopFiles,
    setDesktopFiles,
    setError,
    loadDesktop,
    loadDesktopRootContents,
  } = useDesktopData({
    desktopId,
  })

  const {
    settings,
    saving: settingsSaving,
    updateSettings,
  } = useDesktopSettings(desktop, setDesktop)

  const { folders, setFolders, files, setFiles, loading, loadContents } =
    useDesktopContents({
      desktopId,
      onError: setError,
    })

  const {
    currentFolder,
    setCurrentFolder,
    folderPath,
    setFolderPath,
    openExplorer,
    openFolder,
    goToRoot,
    goToBreadcrumb,
  } = useExplorer({
    loadContents,
  })

  const {
    iconPositions,
    draggingIcon,
    handleIconPointerDown,
    handleIconPointerMove,
    handleIconPointerUp,
    arrangeDesktopIcons,
  } = useDesktopIcons({
    desktop,
    desktopFolders,
    desktopFiles,
    setError,
  })

  const [contextMenu, setContextMenu] = useState<DesktopContextMenu>(null)
  const [selectedItem, setSelectedItem] = useState<SelectedItem>(null)
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const [renaming, setRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [explorerOpen, setExplorerOpen] = useState(false)
  const [explorerMinimized, setExplorerMinimized] = useState(false)
  const [startOpen, setStartOpen] = useState(false)
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false)
  const [desktopMenuPosition, setDesktopMenuPosition] = useState({
    x: 0,
    y: 0,
  })
  const [personalizeOpen, setPersonalizeOpen] = useState(false)

  const {
    actionLoading,
    handleOpenFile,
    handleDownloadFile,
    handleCreateFolder,
    handleRename,
    handleDelete,
  } = useDesktopActions({
    desktopId,
    currentFolder,
    selectedItem,
    newFolderName,
    renameValue,
    loadContents,
    loadDesktopRootContents,
    setError,
    setSelectedItem,
    setCreatingFolder,
    setNewFolderName,
    setRenaming,
    setRenameValue,
    setDeleting,
  })

  function getWindowStyle(settings: Desktop["settings"]) {
    const opacity = settings.theme.windowOpacity

    switch (settings.theme.windowStyle) {
      case "glass":
        return {
          backgroundColor: `rgba(15, 23, 42, ${Math.max(0.75, opacity)})`,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }

      case "flat":
        return {
          backgroundColor: `rgba(15, 23, 42, ${Math.max(0.9, opacity)})`,
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        }

      case "retro":
        return {
          backgroundColor: `rgba(192, 192, 192, ${Math.max(0.95, opacity)})`,
          backdropFilter: "none",
          WebkitBackdropFilter: "none",
        }

      case "classic":
      default:
        return {
          backgroundColor: `rgba(15, 23, 42, ${Math.max(0.9, opacity)})`,
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }
    }
  }

  function openExplorerWindow() {
    setExplorerOpen(true)
    setExplorerMinimized(false)
  }

  function openExplorerRoot() {
    openExplorerWindow()
    void openExplorer()
  }

  function openExplorerFolder(folder: Folder) {
    openExplorerWindow()
    void openFolder(folder)
  }

  function selectItem(item: SelectedItem) {
    setSelectedItem(item)
    setDesktopMenuOpen(false)
  }

  function refreshDesktop() {
    void loadDesktop()
    void loadDesktopRootContents()

    if (explorerOpen) {
      void loadContents(currentFolder)
    }
  }

  function openPersonalize() {
    setPersonalizeOpen(true)
    setDesktopMenuOpen(false)
  }

  useEffect(() => {
    if (!lastEvent) {
      return
    }

    switch (lastEvent.type) {
      case "folder.created": {
        const folder = lastEvent.folder

        if (folder.parentFolderId === null) {
          setDesktopFolders((current) => {
            if (current.some((item) => item.id === folder.id)) {
              return current
            }

            return [...current, folder]
          })
        }

        if (folder.parentFolderId === (currentFolder?.id ?? null)) {
          setFolders((current) => {
            if (current.some((item) => item.id === folder.id)) {
              return current
            }

            return [...current, folder]
          })
        }

        break
      }

      case "folder.updated": {
        const folder = lastEvent.folder

        setDesktopFolders((current) => {
          const exists = current.some((item) => item.id === folder.id)

          if (folder.parentFolderId !== null) {
            return current.filter((item) => item.id !== folder.id)
          }

          if (!exists) {
            return [...current, folder]
          }

          return current.map((item) => (item.id === folder.id ? folder : item))
        })

        setFolders((current) => {
          const belongsHere =
            folder.parentFolderId === (currentFolder?.id ?? null)

          const exists = current.some((item) => item.id === folder.id)

          if (!belongsHere) {
            return current.filter((item) => item.id !== folder.id)
          }

          if (!exists) {
            return [...current, folder]
          }

          return current.map((item) => (item.id === folder.id ? folder : item))
        })

        setCurrentFolder((current) => {
          if (!current || current.id !== folder.id) {
            return current
          }

          return folder
        })

        setFolderPath((currentPath) =>
          currentPath.map((item) => (item.id === folder.id ? folder : item)),
        )

        if (
          currentFolder?.id === folder.id &&
          folder.parentFolderId !== currentFolder.parentFolderId
        ) {
          void loadContents(folder)
        }

        break
      }

      case "folder.deleted": {
        const folderId = lastEvent.folderId

        setDesktopFolders((current) =>
          current.filter((item) => item.id !== folderId),
        )

        setFolders((current) => current.filter((item) => item.id !== folderId))

        setSelectedItem((current) => {
          if (current?.type === "folder" && current.item.id === folderId) {
            return null
          }

          return current
        })

        if (currentFolder?.id === folderId) {
          setCurrentFolder(null)
          setFolderPath([])
          void loadContents(null)
        } else {
          void loadContents(currentFolder)
        }

        break
      }

      case "file.created": {
        const file = lastEvent.file

        if (file.folderId === null) {
          setDesktopFiles((current) => {
            if (current.some((item) => item.id === file.id)) {
              return current
            }

            return [...current, file]
          })
        }

        if (file.folderId === (currentFolder?.id ?? null)) {
          setFiles((current) => {
            if (current.some((item) => item.id === file.id)) {
              return current
            }

            return [...current, file]
          })
        }

        break
      }

      case "file.updated": {
        const file = lastEvent.file

        setDesktopFiles((current) => {
          const exists = current.some((item) => item.id === file.id)

          if (file.folderId !== null) {
            return current.filter((item) => item.id !== file.id)
          }

          if (!exists) {
            return [...current, file]
          }

          return current.map((item) => (item.id === file.id ? file : item))
        })

        setFiles((current) => {
          const belongsHere = file.folderId === (currentFolder?.id ?? null)

          const exists = current.some((item) => item.id === file.id)

          if (!belongsHere) {
            return current.filter((item) => item.id !== file.id)
          }

          if (!exists) {
            return [...current, file]
          }

          return current.map((item) => (item.id === file.id ? file : item))
        })

        setSelectedItem((current) => {
          if (current?.type === "file" && current.item.id === file.id) {
            return {
              type: "file",
              item: file,
            }
          }

          return current
        })

        break
      }

      case "file.deleted": {
        const fileId = lastEvent.fileId

        setDesktopFiles((current) =>
          current.filter((item) => item.id !== fileId),
        )

        setFiles((current) => current.filter((item) => item.id !== fileId))

        setSelectedItem((current) => {
          if (current?.type === "file" && current.item.id === fileId) {
            return null
          }

          return current
        })

        break
      }

      default:
        break
    }
  }, [
    lastEvent,
    currentFolder,
    setCurrentFolder,
    setFolderPath,
    setDesktopFolders,
    setDesktopFiles,
    setFolders,
    setFiles,
    loadContents,
  ])

  useEffect(() => {
    if (!desktopId) {
      return
    }

    void Promise.all([
      loadDesktop(),
      loadDesktopRootContents(),
      loadContents(null),
    ])
  }, [desktopId, loadDesktop, loadDesktopRootContents, loadContents])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return
      }

      setDesktopMenuOpen(false)
      setStartOpen(false)
      setContextMenu(null)
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!contextMenu) {
      return
    }

    function handlePointerDown() {
      setContextMenu(null)
    }

    window.addEventListener("pointerdown", handlePointerDown)

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
    }
  }, [contextMenu])

  function formatFileSize(size: number) {
    if (size < 1024) {
      return `${size} B`
    }

    if (size < 1024 * 1024) {
      return `${(size / 1024).toFixed(1)} KB`
    }

    if (size < 1024 * 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`
    }

    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  return (
    <div
      className="relative h-screen overflow-hidden bg-cover bg-center select-none"
      style={{
        backgroundImage: desktop?.wallpaper
          ? `url(${desktop.wallpaper})`
          : undefined,
        backgroundColor: settings?.theme.backgroundColor ?? "#245edb",
      }}
      onClick={() => {
        setDesktopMenuOpen(false)
        setContextMenu(null)
        setStartOpen(false)
        setSelectedItem(null)
      }}
      onMouseMove={(event) => {
        sendCursor(event.clientX, event.clientY)
      }}
      onContextMenu={(event) => {
        event.preventDefault()

        const menuWidth = 240
        const menuHeight = 260

        const x = Math.min(event.clientX, window.innerWidth - menuWidth - 8)
        const y = Math.min(event.clientY, window.innerHeight - menuHeight - 8)

        setDesktopMenuPosition({
          x: Math.max(8, x),
          y: Math.max(8, y),
        })

        setDesktopMenuOpen(true)
        setStartOpen(false)
        setSelectedItem(null)
      }}
    >
      <div className="absolute inset-0 bg-black/5">
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            fontFamily:
              settings?.theme.font === "mono"
                ? "monospace"
                : settings?.theme.font === "pixel"
                  ? '"Press Start 2P", monospace'
                  : "system-ui, sans-serif",
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()

              setSelectedItem(null)
              openExplorerRoot()
            }}
            className="flex w-24 flex-col items-center gap-2 rounded-md p-2 text-center text-white transition hover:bg-white/10 focus:bg-white/15"
          >
            <div className="flex h-14 w-14 items-center justify-center text-5xl drop-shadow-lg">
              🖥️
            </div>

            <span className="text-xs font-medium drop-shadow-md">
              {desktop?.name ?? "Computer"}
            </span>
          </button>

          {desktop && (
            <DesktopCanvas
              desktop={desktop}
              folders={desktopFolders}
              files={desktopFiles}
              iconPositions={iconPositions}
              selectedItem={selectedItem}
              draggingIcon={draggingIcon}
              onSelect={selectItem}
              onOpenFolder={openExplorerFolder}
              onOpenFile={handleOpenFile}
              onPointerDown={handleIconPointerDown}
              onPointerMove={handleIconPointerMove}
              onPointerUp={handleIconPointerUp}
              onContextMenu={(event, item) => {
                setContextMenu({
                  type: item.type,
                  x: event.clientX,
                  y: event.clientY,
                  [item.type]: item.item,
                } as DesktopContextMenu)
              }}
            />
          )}
        </div>
      </div>

      {desktopMenuOpen && (
        <div
          className="absolute z-200 w-60 rounded-md border border-white/20 bg-slate-900/95 p-1 text-sm text-white shadow-2xl backdrop-blur-xl"
          style={{
            left: desktopMenuPosition.x,
            top: desktopMenuPosition.y,
          }}
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            disabled={desktop?.role === "viewer"}
            onClick={() => {
              if (desktop?.role === "viewer") {
                return
              }

              setCreatingFolder(true)
              setDesktopMenuOpen(false)
            }}
            className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span>📁 New folder</span>
          </button>

          <button
            type="button"
            onClick={() => {
              openExplorerRoot()
              setDesktopMenuOpen(false)
            }}
            className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-white/10"
          >
            <span>🖥️ Open Explorer</span>
          </button>

          <div className="my-1 border-t border-white/10" />

          <div className="group relative">
            <button
              type="button"
              disabled={desktop?.role === "viewer"}
              className="flex w-full items-center justify-between rounded px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span>↕️ Arrange icons</span>
              <span className="text-slate-500">›</span>
            </button>

            <div className="absolute left-full top-0 ml-1 hidden w-44 rounded-md border border-white/20 bg-slate-900/95 p-1 shadow-2xl backdrop-blur-xl group-hover:block">
              <button
                type="button"
                disabled={desktop?.role === "viewer"}
                onClick={() => {
                  if (desktop?.role === "viewer") {
                    return
                  }

                  void arrangeDesktopIcons("name")
                }}
                className="w-full rounded px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                By name
              </button>

              <button
                type="button"
                disabled={desktop?.role === "viewer"}
                onClick={() => {
                  if (desktop?.role === "viewer") {
                    return
                  }

                  void arrangeDesktopIcons("type")
                }}
                className="w-full rounded px-3 py-2 text-left hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                By type
              </button>
            </div>
          </div>

          <div className="my-1 border-t border-white/10" />

          <button
            type="button"
            onClick={() => {
              setDesktopMenuOpen(false)
              refreshDesktop()
            }}
            className="flex w-full items-center rounded px-3 py-2 text-left hover:bg-white/10"
          >
            <span>↻ Refresh</span>
          </button>

          <button
            type="button"
            onClick={openPersonalize}
            className="flex w-full items-center rounded px-3 py-2 text-left hover:bg-white/10"
          >
            <span>🎨 Personalize</span>
          </button>
        </div>
      )}

      {contextMenu?.type === "desktop" && (
        <DesktopContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          desktop={desktop}
          onClose={() => setContextMenu(null)}
          onCreateFolder={() => setCreatingFolder(true)}
          onArrange={(sortBy) => void arrangeDesktopIcons(sortBy)}
          onOpenExplorer={openExplorerRoot}
          onRefresh={refreshDesktop}
          onPersonalize={openPersonalize}
        />
      )}

      {contextMenu?.type === "folder" && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type="folder"
          folder={contextMenu.folder}
          desktop={desktop}
          onClose={() => setContextMenu(null)}
          onOpen={() => openExplorerFolder(contextMenu.folder)}
          onProperties={() => {
            selectItem({
              type: "folder",
              item: contextMenu.folder,
            })
          }}
          onRename={() => {
            setSelectedItem({
              type: "folder",
              item: contextMenu.folder,
            })
            setRenameValue(contextMenu.folder.name)
            setRenaming(true)
          }}
          onDelete={() => {
            setSelectedItem({
              type: "folder",
              item: contextMenu.folder,
            })
            setDeleting(true)
          }}
        />
      )}

      {contextMenu?.type === "file" && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          type="file"
          file={contextMenu.file}
          desktop={desktop}
          onClose={() => setContextMenu(null)}
          onOpen={() => {
            void handleOpenFile(contextMenu.file)
          }}
          onProperties={() => {
            selectItem({
              type: "file",
              item: contextMenu.file,
            })
          }}
          onRename={() => {
            setSelectedItem({
              type: "file",
              item: contextMenu.file,
            })
            setRenameValue(contextMenu.file.name)
            setRenaming(true)
          }}
          onDelete={() => {
            setSelectedItem({
              type: "file",
              item: contextMenu.file,
            })
            setDeleting(true)
          }}
        />
      )}

      {desktop && (
        <ExplorerWindow
          desktop={desktop}
          desktopId={desktopId}
          explorerOpen={explorerOpen}
          explorerMinimized={explorerMinimized}
          currentFolder={currentFolder}
          folderPath={folderPath}
          folders={folders}
          files={files}
          loading={loading}
          selectedItem={selectedItem}
          windowStyle={getWindowStyle(desktop.settings)}
          onMinimize={() => setExplorerMinimized(true)}
          onClose={() => setExplorerOpen(false)}
          onGoToRoot={() => void goToRoot()}
          onGoToBreadcrumb={(index) => void goToBreadcrumb(index)}
          onCreateFolder={() => setCreatingFolder(true)}
          onUploaded={() => {
            void loadContents(currentFolder)
            void loadDesktopRootContents()
          }}
          onSelectItem={selectItem}
          onOpenFolder={(folder) => void openFolder(folder)}
          onOpenFile={(file) => void handleOpenFile(file)}
          onDownloadFile={(file) => void handleDownloadFile(file)}
          onRename={() => {
            if (!selectedItem) {
              return
            }

            setRenameValue(selectedItem.item.name)
            setRenaming(true)
          }}
          onDelete={() => setDeleting(true)}
          formatFileSize={formatFileSize}
        />
      )}

      {desktop && (
        <DesktopSettings
          desktop={desktop}
          open={personalizeOpen}
          onClose={() => setPersonalizeOpen(false)}
          onUpdate={updateSettings}
          saving={settingsSaving}
        />
      )}

      <CreateFolderModal
        open={creatingFolder}
        currentFolder={currentFolder}
        desktopName={desktop?.name}
        newFolderName={newFolderName}
        actionLoading={actionLoading}
        onNameChange={setNewFolderName}
        onSubmit={handleCreateFolder}
        onClose={() => {
          setCreatingFolder(false)
          setNewFolderName("")
        }}
      />

      <RenameModal
        open={renaming}
        selectedItem={selectedItem}
        renameValue={renameValue}
        actionLoading={actionLoading}
        onValueChange={setRenameValue}
        onSubmit={handleRename}
        onClose={() => {
          setRenaming(false)
          setRenameValue("")
        }}
      />

      <DeleteModal
        open={deleting}
        selectedItem={selectedItem}
        actionLoading={actionLoading}
        onConfirm={handleDelete}
        onClose={() => setDeleting(false)}
      />

      {startOpen && (
        <DesktopStartMenu
          desktop={desktop}
          open={startOpen}
          onClose={() => setStartOpen(false)}
          onOpenExplorer={openExplorerRoot}
          onPersonalize={openPersonalize}
          onRefresh={refreshDesktop}
        />
      )}

      <DesktopCursors cursors={cursors} />

      {settings?.layout.showTaskbar && (
        <DesktopTaskbar
          taskbarStyle={settings.theme.taskbarStyle}
          taskbarPosition={settings.theme.taskbarPosition}
          showClock={settings.layout.showClock}
          startOpen={startOpen}
          onToggleStart={() => {
            setStartOpen((open) => !open)
            setDesktopMenuOpen(false)
            setContextMenu(null)
          }}
          explorerOpen={explorerOpen}
          explorerMinimized={explorerMinimized}
          onToggleExplorer={() => {
            setExplorerMinimized((minimized) => !minimized)
          }}
        />
      )}
    </div>
  )
}
