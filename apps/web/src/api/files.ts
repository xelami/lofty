import { apiFetch } from "./client"

export type FileItem = {
  id: string
  desktopId: string
  folderId: string | null
  name: string
  mimeType: string
  size: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type Folder = {
  id: string
  desktopId: string
  parentFolderId: string | null
  name: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

/* -------------------------------------------------------------------------- */
/* Files                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Get files in a folder.
 *
 * No folderId = root files.
 */
export async function getFiles(desktopId: string, folderId?: string) {
  const params = new URLSearchParams()

  if (folderId) {
    params.set("folderId", folderId)
  }

  const query = params.toString()

  return apiFetch<{
    files: FileItem[]
  }>(`/desktops/${desktopId}/files${query ? `?${query}` : ""}`)
}

/**
 * Generate a presigned R2 upload URL.
 */
export async function getUploadUrl(
  desktopId: string,
  file: {
    name: string
    mimeType: string
    size: number
    folderId?: string
  },
) {
  return apiFetch<{
    fileId: string
    storageKey: string
    uploadUrl: string
  }>(`/desktops/${desktopId}/files/upload-url`, {
    method: "POST",
    body: file,
  })
}

/**
 * Confirm an uploaded file and create its database metadata.
 */
export async function confirmUpload(
  desktopId: string,
  file: {
    fileId: string
    name: string
    mimeType: string
    size: number
    folderId?: string
  },
) {
  return apiFetch<{
    file: FileItem
  }>(`/desktops/${desktopId}/files`, {
    method: "POST",
    body: file,
  })
}

/**
 * Rename or move a file.
 */
export async function updateFile(
  desktopId: string,
  fileId: string,
  data: {
    name?: string
    folderId?: string | null
  },
) {
  return apiFetch<{
    file: FileItem
  }>(`/desktops/${desktopId}/files/${fileId}`, {
    method: "PATCH",
    body: data,
  })
}

/**
 * Generate a presigned R2 download URL.
 */
export async function getDownloadUrl(
  desktopId: string,
  fileId: string,
  download = false,
) {
  const params = new URLSearchParams()

  if (download) {
    params.set("download", "true")
  }

  const query = params.toString()

  return apiFetch<{
    downloadUrl: string
  }>(
    `/desktops/${desktopId}/files/${fileId}/download-url${
      query ? `?${query}` : ""
    }`,
  )
}

/**
 * Delete a file.
 */
export async function deleteFile(desktopId: string, fileId: string) {
  return apiFetch<{
    success: true
  }>(`/desktops/${desktopId}/files/${fileId}`, {
    method: "DELETE",
  })
}

/* -------------------------------------------------------------------------- */
/* Folders                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Get folders inside a parent folder.
 *
 * No parentFolderId = root folders.
 */
export async function getFolders(desktopId: string, parentFolderId?: string) {
  const params = new URLSearchParams()

  if (parentFolderId) {
    params.set("parentFolderId", parentFolderId)
  }

  const query = params.toString()

  return apiFetch<{
    folders: Folder[]
  }>(`/desktops/${desktopId}/folders${query ? `?${query}` : ""}`)
}

/**
 * Create a folder.
 */
export async function createFolder(
  desktopId: string,
  name: string,
  parentFolderId?: string,
) {
  return apiFetch<{
    folder: Folder
  }>(`/desktops/${desktopId}/folders`, {
    method: "POST",
    body: {
      name,
      parentFolderId,
    },
  })
}

/**
 * Rename or move a folder.
 */
export async function updateFolder(
  desktopId: string,
  folderId: string,
  data: {
    name?: string
    parentFolderId?: string | null
  },
) {
  return apiFetch<{
    folder: Folder
  }>(`/desktops/${desktopId}/folders/${folderId}`, {
    method: "PATCH",
    body: data,
  })
}

/**
 * Delete a folder and its contents.
 */
export async function deleteFolder(desktopId: string, folderId: string) {
  return apiFetch<{
    success: true
  }>(`/desktops/${desktopId}/folders/${folderId}`, {
    method: "DELETE",
  })
}

export async function renameFile(fileId: string, name: string) {
  return apiFetch<{
    file: FileItem
  }>(`/files/${fileId}`, {
    method: "PATCH",
    body: {
      name,
    },
  })
}
