import { useState } from "react"

import { useExplorer } from "./useExplorer"

import type { Folder } from "../../api/files"

type UseExplorerWindowOptions = {
  loadContents: (folder: Folder | null) => Promise<void>
}

export function useExplorerWindow({ loadContents }: UseExplorerWindowOptions) {
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

  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)

  function openExplorerWindow() {
    setOpen(true)
    setMinimized(false)
    void openExplorer()
  }

  function openFolderInExplorer(folder: Folder) {
    setOpen(true)
    setMinimized(false)
    void openFolder(folder)
  }

  function minimize() {
    setMinimized(true)
  }

  function restore() {
    setOpen(true)
    setMinimized(false)
  }

  function close() {
    setOpen(false)
  }

  function toggleMinimized() {
    setMinimized((current) => !current)
  }

  return {
    // Window state
    open,
    minimized,

    // Navigation state
    currentFolder,
    folderPath,

    // Navigation actions
    goToRoot,
    goToBreadcrumb,

    // Window actions
    openExplorer: openExplorerWindow,
    openFolder: openFolderInExplorer,
    minimize,
    restore,
    close,
    toggleMinimized,

    // Exposed setters
    setCurrentFolder,
    setFolderPath,
  }
}
