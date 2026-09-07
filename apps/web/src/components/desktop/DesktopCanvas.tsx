import type { FileItem, Folder } from "../../api/files"
import type { Desktop } from "../../api/desktops"

import { DesktopIcon } from "./DesktopIcon"

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

type DesktopCanvasProps = {
  desktop: Desktop

  folders: Folder[]
  files: FileItem[]

  iconPositions: Record<string, { x: number; y: number }>

  selectedItem: SelectedItem
  draggingIcon: string | null

  onSelect: (item: SelectedItem) => void

  onOpenFolder: (folder: Folder) => void
  onOpenFile: (file: FileItem) => void

  onPointerDown: (
    event: React.PointerEvent<HTMLButtonElement>,
    id: string,
    position: { x: number; y: number },
  ) => void

  onPointerMove: (
    event: React.PointerEvent<HTMLButtonElement>,
    id: string,
  ) => void

  onPointerUp: (
    event: React.PointerEvent<HTMLButtonElement>,
    id: string,
  ) => void

  onContextMenu: (
    event: React.MouseEvent<HTMLButtonElement>,
    item:
      | {
          type: "folder"
          item: Folder
        }
      | {
          type: "file"
          item: FileItem
        },
  ) => void
}

function getDesktopIconSize(size: Desktop["settings"]["layout"]["iconSize"]) {
  switch (size) {
    case "small":
      return {
        container: "w-20",
        icon: "text-4xl",
        text: "text-[11px]",
      }

    case "large":
      return {
        container: "w-28",
        icon: "text-6xl",
        text: "text-sm",
      }

    case "medium":
    default:
      return {
        container: "w-24",
        icon: "text-5xl",
        text: "text-xs",
      }
  }
}

function getDesktopIconSpacing(
  spacing: Desktop["settings"]["layout"]["iconSpacing"],
) {
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

function getDesktopIconStyle(style: Desktop["settings"]["theme"]["iconStyle"]) {
  switch (style) {
    case "minimal":
      return {
        icon: "drop-shadow-sm",
        container: "rounded-lg",
      }

    case "pixel":
      return {
        icon: "drop-shadow-none",
        container: "rounded-none",
      }

    case "classic":
    default:
      return {
        icon: "drop-shadow-lg",
        container: "rounded-md",
      }
  }
}

export function DesktopCanvas({
  desktop,
  folders,
  files,
  iconPositions,
  selectedItem,
  draggingIcon,
  onSelect,
  onOpenFolder,
  onOpenFile,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onContextMenu,
}: DesktopCanvasProps) {
  const iconSize = getDesktopIconSize(desktop.settings.layout.iconSize)

  const spacing = getDesktopIconSpacing(desktop.settings.layout.iconSpacing)

  const iconStyle = getDesktopIconStyle(desktop.settings.theme.iconStyle)

  const labelPosition = desktop.settings.layout.iconLabelPosition ?? "below"

  const items = [
    ...folders.map((folder) => ({
      type: "folder" as const,
      item: folder,
    })),

    ...files.map((file) => ({
      type: "file" as const,
      item: file,
    })),
  ]

  return (
    <div className="absolute inset-0 overflow-hidden">
      {items.map((item, index) => {
        const column = Math.floor(index / 6)
        const row = index % 6

        const defaultPosition = {
          x: 24 + column * spacing.x,
          y: 24 + row * spacing.y,
        }

        const position = iconPositions[item.item.id] ?? defaultPosition

        const isSelected =
          selectedItem?.type === item.type &&
          selectedItem.item.id === item.item.id

        return (
          <DesktopIcon
            key={item.item.id}
            item={item}
            position={position}
            selected={isSelected}
            dragging={draggingIcon === item.item.id}
            size={iconSize}
            style={iconStyle}
            labelPosition={labelPosition}
            accentColor={desktop.settings.theme.accentColor}
            onPointerDown={(event) =>
              onPointerDown(event, item.item.id, position)
            }
            onPointerMove={(event) => onPointerMove(event, item.item.id)}
            onPointerUp={(event) => onPointerUp(event, item.item.id)}
            onClick={(event) => {
              event.stopPropagation()

              onSelect(item)
            }}
            onDoubleClick={(event) => {
              event.stopPropagation()

              if (item.type === "folder") {
                void onOpenFolder(item.item)
              } else {
                void onOpenFile(item.item)
              }
            }}
            onContextMenu={(event) => {
              event.preventDefault()
              event.stopPropagation()

              onContextMenu(event, item)
            }}
          />
        )
      })}
    </div>
  )
}
