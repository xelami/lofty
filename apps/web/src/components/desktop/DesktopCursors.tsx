import type { RemoteCursor } from "../../hooks/useDesktopRealtime"

type DesktopCursorsProps = {
  cursors: Record<string, RemoteCursor>
}

export function DesktopCursors({ cursors }: DesktopCursorsProps) {
  return (
    <>
      {Object.values(cursors).map((cursor) => (
        <div
          key={cursor.userId}
          className="pointer-events-none absolute z-[180]"
          style={{
            left: cursor.x,
            top: cursor.y,
          }}
        >
          <div className="relative">
            {/* Cursor */}
            <svg
              width="20"
              height="24"
              viewBox="0 0 20 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 1L17.5 15.5L10.5 16.5L14 23L10.5 24L7 17L2 21V1Z"
                fill="white"
                stroke="black"
                strokeWidth="1.5"
              />
            </svg>

            {/* Name */}
            <div className="absolute left-4 top-4 whitespace-nowrap rounded bg-black/75 px-2 py-1 text-[10px] text-white shadow-lg backdrop-blur-sm">
              {cursor.name}
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
