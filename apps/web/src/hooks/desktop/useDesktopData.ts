import { useCallback, useState } from "react"

import { getDesktops, type Desktop } from "../../api/desktops"

import {
  getFiles,
  getFolders,
  type FileItem,
  type Folder,
} from "../../api/files"

type UseDesktopDataOptions = {
  desktopId: string | undefined
  onDesktopLoaded?: (desktop: Desktop) => void
}

export function useDesktopData({
  desktopId,
  onDesktopLoaded,
}: UseDesktopDataOptions) {
  const [desktop, setDesktop] = useState<Desktop | null>(null)

  const [desktopFolders, setDesktopFolders] = useState<Folder[]>([])
  const [desktopFiles, setDesktopFiles] = useState<FileItem[]>([])

  const [error, setError] = useState<string | null>(null)

  const loadDesktop = useCallback(async () => {
    if (!desktopId) {
      return
    }

    try {
      setError(null)

      const result = await getDesktops()

      const foundDesktop = result.desktops.find(
        (desktop) => desktop.id === desktopId,
      )

      if (!foundDesktop) {
        throw new Error("Desktop not found")
      }

      setDesktop(foundDesktop)
      onDesktopLoaded?.(foundDesktop)
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to load desktop",
      )
    }
  }, [desktopId, onDesktopLoaded])

  const loadDesktopRootContents = useCallback(async () => {
    if (!desktopId) {
      return
    }

    try {
      const [foldersResult, filesResult] = await Promise.all([
        getFolders(desktopId),
        getFiles(desktopId),
      ])

      setDesktopFolders(foldersResult.folders)
      setDesktopFiles(filesResult.files)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to load desktop contents",
      )
    }
  }, [desktopId])

  return {
    desktop,
    setDesktop,
    desktopFolders,
    setDesktopFolders,
    desktopFiles,
    setDesktopFiles,
    error,
    setError,
    loadDesktop,
    loadDesktopRootContents,
  }
}
