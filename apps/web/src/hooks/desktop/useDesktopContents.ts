import { useCallback, useState } from "react"

import {
  getFiles,
  getFolders,
  type FileItem,
  type Folder,
} from "../../api/files"

type UseDesktopContentsOptions = {
  desktopId: string | undefined
  onError?: (message: string | null) => void
}

export function useDesktopContents({
  desktopId,
  onError,
}: UseDesktopContentsOptions) {
  const [folders, setFolders] = useState<Folder[]>([])
  const [files, setFiles] = useState<FileItem[]>([])
  const [loading, setLoading] = useState(true)

  const loadContents = useCallback(
    async (folder: Folder | null) => {
      if (!desktopId) {
        return
      }

      try {
        onError?.(null)

        setLoading(true)

        const [foldersResult, filesResult] = await Promise.all([
          getFolders(desktopId, folder?.id),
          getFiles(desktopId, folder?.id),
        ])

        setFolders(foldersResult.folders)
        setFiles(filesResult.files)
      } catch (error) {
        onError?.(
          error instanceof Error ? error.message : "Failed to load files",
        )
      } finally {
        setLoading(false)
      }
    },
    [desktopId, onError],
  )

  return {
    folders,
    setFolders,
    files,
    setFiles,
    loading,
    loadContents,
  }
}
