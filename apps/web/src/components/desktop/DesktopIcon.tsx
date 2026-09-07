import type { FileItem, Folder } from "../../api/files"

type DesktopIconItem =
  | {
      type: "folder"
      item: Folder
    }
  | {
      type: "file"
      item: FileItem
    }

type DesktopIconProps = {
  item: DesktopIconItem
  position: {
    x: number
    y: number
  }
  selected: boolean
  dragging: boolean

  size: {
    container: string
    icon: string
    text: string
  }

  style: {
    icon: string
    container: string
  }

  labelPosition: "below" | "right" | "hidden"
  accentColor?: string

  onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void

  onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void

  onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void

  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void

  onDoubleClick: (event: React.MouseEvent<HTMLButtonElement>) => void

  onContextMenu: (event: React.MouseEvent<HTMLButtonElement>) => void
}

function getFileIcon(file: FileItem) {
  if (file.mimeType.startsWith("image/")) return "🖼️"
  if (file.mimeType.startsWith("video/")) return "🎬"
  if (file.mimeType.startsWith("audio/")) return "🎵"
  if (file.mimeType.includes("pdf")) return "📕"

  if (
    file.mimeType.includes("zip") ||
    file.mimeType.includes("compressed") ||
    file.mimeType.includes("archive")
  ) {
    return "🗜️"
  }

  if (
    file.mimeType.includes("spreadsheet") ||
    file.mimeType.includes("excel")
  ) {
    return "📊"
  }

  if (file.mimeType.includes("word") || file.mimeType.includes("document")) {
    return "📝"
  }

  if (
    file.mimeType.includes("presentation") ||
    file.mimeType.includes("powerpoint")
  ) {
    return "📽️"
  }

  return "📄"
}

export function DesktopIcon({
  item,
  position,
  selected,
  dragging,
  size,
  style,
  labelPosition,
  accentColor,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onClick,
  onDoubleClick,
  onContextMenu,
}: DesktopIconProps) {
  const icon = item.type === "folder" ? "📁" : getFileIcon(item.item)

  const name = item.item.name

  return (
    <button
      type="button"
      onContextMenu={onContextMenu}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={[
        "absolute select-none text-white transition",
        size.container,
        style.container,
        dragging ? "cursor-grabbing scale-105" : "cursor-grab",
        selected ? "ring-1 ring-white/40" : "hover:bg-white/10",
      ].join(" ")}
      style={{
        left: position.x,
        top: position.y,
        backgroundColor: selected ? `${accentColor ?? "#ffffff"}33` : undefined,
      }}
    >
      <div
        className={[
          "flex items-center justify-center",
          labelPosition === "right" ? "flex-row gap-2" : "flex-col gap-2",
        ].join(" ")}
      >
        <div className={[size.icon, style.icon, "leading-none"].join(" ")}>
          {icon}
        </div>

        {labelPosition !== "hidden" && (
          <span
            className={[
              "line-clamp-2 font-medium drop-shadow-md",
              size.text,
              labelPosition === "right" ? "max-w-20 text-left" : "text-center",
            ].join(" ")}
          >
            {name}
          </span>
        )}
      </div>
    </button>
  )
}
