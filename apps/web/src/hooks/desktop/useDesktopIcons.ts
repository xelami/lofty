import { useEffect, useRef, useState } from "react"

import {
  getDesktopItems,
  updateDesktopItemPosition,
  updateDesktopItemPositions,
  type Desktop,
} from "../../api/desktops"

import type { Folder } from "../../api/files"
import type { FileItem } from "../../api/files"

type IconPosition = {
  x: number
  y: number
}

type UseDesktopIconsOptions = {
  desktop: Desktop | null
  desktopFolders: Folder[]
  desktopFiles: FileItem[]
  setError: (error: string | null) => void
}

export function useDesktopIcons({
  desktop,
  desktopFolders,
  desktopFiles,
  setError,
}: UseDesktopIconsOptions) {
  const [iconPositions, setIconPositions] = useState<
    Record<string, IconPosition>
  >({})

  const [draggingIcon, setDraggingIcon] = useState<string | null>(null)

  const [dragOffset, setDragOffset] = useState({
    x: 0,
    y: 0,
  })

  const draggedPositionRef = useRef<{
    id: string
    x: number
    y: number
  } | null>(null)

  function handleIconPointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    id: string,
    position: IconPosition,
  ) {
    event.preventDefault()
    event.stopPropagation()

    setDraggingIcon(id)

    setDragOffset({
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    })

    draggedPositionRef.current = {
      id,
      x: position.x,
      y: position.y,
    }

    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handleIconPointerMove(
    event: React.PointerEvent<HTMLButtonElement>,
    id: string,
  ) {
    if (draggingIcon !== id) return

    const x = Math.max(0, event.clientX - dragOffset.x)
    const y = Math.max(0, event.clientY - dragOffset.y)

    setIconPositions((current) => ({
      ...current,
      [id]: {
        x,
        y,
      },
    }))

    draggedPositionRef.current = {
      id,
      x,
      y,
    }
  }

  async function handleIconPointerUp(
    event: React.PointerEvent<HTMLButtonElement>,
    id: string,
  ) {
    if (draggingIcon !== id) return

    const finalPosition = draggedPositionRef.current

    event.currentTarget.releasePointerCapture(event.pointerId)

    setDraggingIcon(null)
    draggedPositionRef.current = null

    if (!desktop || !finalPosition || finalPosition.id !== id) {
      return
    }

    try {
      await updateDesktopItemPosition(
        desktop.id,
        id,
        finalPosition.x,
        finalPosition.y,
      )
    } catch (error) {
      console.error("Failed to save desktop icon position:", error)
    }
  }

  function getDesktopIconSpacing(
    spacing: Desktop["settings"]["layout"]["iconSpacing"],
  ): IconPosition {
    switch (spacing) {
      case "compact":
        return {
          x: 104,
          y: 96,
        }

      case "wide":
        return {
          x: 144,
          y: 128,
        }

      case "comfortable":
      default:
        return {
          x: 120,
          y: 112,
        }
    }
  }

  async function arrangeDesktopIcons(sortBy: "name" | "type") {
    if (!desktop) return

    const sortedFolders = [...desktopFolders].sort((a, b) =>
      a.name.localeCompare(b.name),
    )

    const sortedFiles = [...desktopFiles].sort((a, b) => {
      if (sortBy === "type") {
        const typeA = a.mimeType || ""
        const typeB = b.mimeType || ""

        const typeComparison = typeA.localeCompare(typeB)

        if (typeComparison !== 0) {
          return typeComparison
        }
      }

      return a.name.localeCompare(b.name)
    })

    const items = [
      ...sortedFolders.map((folder) => ({
        id: folder.id,
      })),
      ...sortedFiles.map((file) => ({
        id: file.id,
      })),
    ]

    const spacing = getDesktopIconSpacing(desktop.settings.layout.iconSpacing)

    const positions: Record<string, IconPosition> = {}

    items.forEach((item, index) => {
      const column = Math.floor(index / 6)
      const row = index % 6

      positions[item.id] = {
        x: 24 + column * spacing.x,
        y: 24 + row * spacing.y,
      }
    })

    // Update UI immediately.
    setIconPositions(positions)

    try {
      await updateDesktopItemPositions(
        desktop.id,
        items.map((item) => ({
          id: item.id,
          x: positions[item.id]!.x,
          y: positions[item.id]!.y,
        })),
      )
    } catch (error) {
      console.error("Failed to arrange desktop icons:", error)

      setError(
        error instanceof Error
          ? error.message
          : "Failed to arrange desktop icons",
      )
    }
  }

  useEffect(() => {
    if (!desktop) return

    let cancelled = false

    async function loadDesktopItems() {
      try {
        const result = await getDesktopItems(desktop!.id)

        if (cancelled) return

        const positions: Record<string, IconPosition> = {}

        for (const item of result.items) {
          const itemId = item.folderId ?? item.fileId

          if (!itemId) continue

          positions[itemId] = {
            x: item.x,
            y: item.y,
          }
        }

        setIconPositions(positions)
      } catch (error) {
        console.error("Failed to load desktop item positions:", error)
      }
    }

    void loadDesktopItems()

    return () => {
      cancelled = true
    }
  }, [desktop?.id])

  function handleDesktopItemMoved(event: {
    type: string
    folderId?: string | null
    fileId?: string | null
    x?: number
    y?: number
  }) {
    if (event.type !== "desktop.item.moved") {
      return
    }

    const iconId = event.folderId ?? event.fileId

    if (!iconId || event.x === undefined || event.y === undefined) {
      return
    }

    setIconPositions((current) => ({
      ...current,
      [iconId]: {
        x: event.x!,
        y: event.y!,
      },
    }))
  }

  return {
    iconPositions,
    setIconPositions,
    draggingIcon,
    handleIconPointerDown,
    handleIconPointerMove,
    handleIconPointerUp,
    arrangeDesktopIcons,
    handleDesktopItemMoved,
  }
}
