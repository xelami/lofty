import {
  useCallback,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react"

import {
  createFolder,
  deleteFile,
  deleteFolder,
  getDownloadUrl,
  updateFile,
  updateFolder,
  type FileItem,
  type Folder,
} from "../../api/files"

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

type UseDesktopActionsOptions = {
  desktopId: string | undefined
  currentFolder: Folder | null
  selectedItem: SelectedItem

  newFolderName: string
  renameValue: string

  loadContents: (folder: Folder | null) => Promise<void>
  loadDesktopRootContents: () => Promise<void>

  setError: (error: string | null) => void
  setSelectedItem: Dispatch<SetStateAction<SelectedItem>>

  setCreatingFolder: Dispatch<SetStateAction<boolean>>
  setNewFolderName: Dispatch<SetStateAction<string>>

  setRenaming: Dispatch<SetStateAction<boolean>>
  setRenameValue: Dispatch<SetStateAction<string>>

  setDeleting: Dispatch<SetStateAction<boolean>>
}

export function useDesktopActions({
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
}: UseDesktopActionsOptions) {
  const [actionLoading, setActionLoading] = useState(false)

  const handleOpenFile = useCallback(
    async (file: FileItem) => {
      if (!desktopId) {
        return
      }

      try {
        setError(null)

        const result = await getDownloadUrl(desktopId, file.id)

        window.open(result.downloadUrl, "_blank", "noopener,noreferrer")
      } catch (error) {
        setError(error instanceof Error ? error.message : "Failed to open file")
      }
    },
    [desktopId, setError],
  )

  const handleDownloadFile = useCallback(
    async (file: FileItem) => {
      if (!desktopId) {
        return
      }

      try {
        setError(null)

        const result = await getDownloadUrl(desktopId, file.id, true)

        window.location.href = result.downloadUrl
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to download file",
        )
      }
    },
    [desktopId, setError],
  )

  const handleCreateFolder = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()

      if (!desktopId || !newFolderName.trim()) {
        return
      }

      try {
        setError(null)
        setActionLoading(true)

        await createFolder(desktopId, newFolderName.trim(), currentFolder?.id)

        setNewFolderName("")
        setCreatingFolder(false)

        await loadContents(currentFolder)
        await loadDesktopRootContents()
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to create folder",
        )
      } finally {
        setActionLoading(false)
      }
    },
    [
      desktopId,
      newFolderName,
      currentFolder,
      loadContents,
      loadDesktopRootContents,
      setError,
      setNewFolderName,
      setCreatingFolder,
    ],
  )

  const handleRename = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()

      if (!desktopId || !selectedItem || !renameValue.trim()) {
        return
      }

      try {
        setError(null)
        setActionLoading(true)

        const newName = renameValue.trim()

        if (selectedItem.type === "folder") {
          await updateFolder(desktopId, selectedItem.item.id, {
            name: newName,
          })
        } else {
          await updateFile(desktopId, selectedItem.item.id, {
            name: newName,
          })
        }

        setRenaming(false)
        setRenameValue("")
        setSelectedItem(null)

        await loadContents(currentFolder)
        await loadDesktopRootContents()
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to rename item",
        )
      } finally {
        setActionLoading(false)
      }
    },
    [
      desktopId,
      selectedItem,
      renameValue,
      currentFolder,
      loadContents,
      loadDesktopRootContents,
      setError,
      setRenaming,
      setRenameValue,
      setSelectedItem,
    ],
  )

  const handleDelete = useCallback(async () => {
    if (!desktopId || !selectedItem) {
      return
    }

    try {
      setError(null)
      setActionLoading(true)

      if (selectedItem.type === "folder") {
        await deleteFolder(desktopId, selectedItem.item.id)
      } else {
        await deleteFile(desktopId, selectedItem.item.id)
      }

      setDeleting(false)
      setSelectedItem(null)

      await loadContents(currentFolder)
      await loadDesktopRootContents()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to delete item")
    } finally {
      setActionLoading(false)
    }
  }, [
    desktopId,
    selectedItem,
    currentFolder,
    loadContents,
    loadDesktopRootContents,
    setError,
    setDeleting,
    setSelectedItem,
  ])

  return {
    actionLoading,
    handleOpenFile,
    handleDownloadFile,
    handleCreateFolder,
    handleRename,
    handleDelete,
  }
}
