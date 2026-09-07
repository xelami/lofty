import { useRef, useState } from "react"

import { confirmUpload, getUploadUrl } from "../api/files"

type FileUploadProps = {
  desktopId: string
  folderId?: string
  onUploaded: () => void | Promise<void>
}

export function FileUpload({
  desktopId,
  folderId,
  onUploaded,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function uploadFile(file: File) {
    setError(null)
    setUploading(true)

    try {
      /*
       * 1. Ask our API for a presigned R2 URL.
       */
      const { fileId, uploadUrl } = await getUploadUrl(desktopId, {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        folderId,
      })

      /*
       * 2. Upload directly to R2.
       *
       * IMPORTANT:
       * The backend signs the URL with Content-Length,
       * so we explicitly send the file size.
       */
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        const text = await uploadResponse.text()

        throw new Error(`R2 upload failed (${uploadResponse.status}): ${text}`)
      }

      /*
       * 3. Tell our API that the R2 upload completed.
       */
      await confirmUpload(desktopId, {
        fileId,
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        folderId,
      })

      /*
       * 4. Refresh the current folder.
       */
      await onUploaded()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to upload file")
    } finally {
      setUploading(false)
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    void uploadFile(file)

    /*
     * Allow selecting the same file again later.
     */
    event.target.value = ""
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload file"}
      </button>

      {error && (
        <p className="max-w-xs text-right text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
