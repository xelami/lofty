import { useState } from "react"

import type { Folder } from "../../api/files"

type UseExplorerOptions = {
  loadContents: (folder: Folder | null) => Promise<void>
}

export function useExplorer({ loadContents }: UseExplorerOptions) {
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null)
  const [folderPath, setFolderPath] = useState<Folder[]>([])

  async function openExplorer(folder: Folder | null = null) {
    setCurrentFolder(folder)

    if (folder) {
      setFolderPath([folder])
    } else {
      setFolderPath([])
    }

    await loadContents(folder)
  }

  async function openFolder(folder: Folder) {
    setCurrentFolder(folder)
    setFolderPath((currentPath) => [...currentPath, folder])

    await loadContents(folder)
  }

  async function goToRoot() {
    setCurrentFolder(null)
    setFolderPath([])

    await loadContents(null)
  }

  async function goToBreadcrumb(index: number) {
    if (index === -1) {
      await goToRoot()
      return
    }

    const folder = folderPath[index]

    if (!folder) {
      return
    }

    setFolderPath((currentPath) => currentPath.slice(0, index + 1))
    setCurrentFolder(folder)

    await loadContents(folder)
  }

  return {
    currentFolder,
    setCurrentFolder,

    folderPath,
    setFolderPath,

    openExplorer,
    openFolder,
    goToRoot,
    goToBreadcrumb,
  }
}
