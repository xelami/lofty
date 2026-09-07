import { useEffect, useState } from "react"

import type { Desktop, DesktopSettingsUpdate } from "../api/desktops"

type DesktopSettingsProps = {
  desktop: Desktop
  open: boolean
  onClose: () => void
  onUpdate: (
    updates: DesktopSettingsUpdate,
  ) => Promise<Desktop["settings"] | undefined>
  saving?: boolean
}

type Section = "desktop" | "windows" | "taskbar" | "icons"

const BACKGROUND_COLOURS = [
  "#245edb",
  "#1e293b",
  "#312e81",
  "#581c87",
  "#831843",
  "#991b1b",
  "#9a3412",
  "#854d0e",
  "#166534",
  "#115e59",
  "#0f766e",
  "#334155",
]

const ACCENT_COLOURS = [
  "#ffffff",
  "#60a5fa",
  "#38bdf8",
  "#a78bfa",
  "#f472b6",
  "#fb7185",
  "#fb923c",
  "#facc15",
  "#4ade80",
  "#2dd4bf",
]

export function DesktopSettings({
  desktop,
  open,
  onClose,
  onUpdate,
  saving = false,
}: DesktopSettingsProps) {
  const [section, setSection] = useState<Section>("desktop")
  const [localDesktop, setLocalDesktop] = useState(desktop)

  useEffect(() => {
    setLocalDesktop(desktop)
  }, [desktop])

  if (!open) {
    return null
  }

  const settings = localDesktop.settings
  const theme = settings.theme
  const layout = settings.layout

  async function updateTheme(updates: Partial<typeof theme>) {
    setLocalDesktop((current) => ({
      ...current,
      settings: {
        ...current.settings,
        theme: {
          ...current.settings.theme,
          ...updates,
        },
      },
    }))

    await onUpdate({
      theme: updates,
    })
  }

  async function updateLayout(updates: Partial<typeof layout>) {
    setLocalDesktop((current) => ({
      ...current,
      settings: {
        ...current.settings,
        layout: {
          ...current.settings.layout,
          ...updates,
        },
      },
    }))

    await onUpdate({
      layout: updates,
    })
  }

  async function handleWallpaperChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    // Temporary local preview.
    // R2 wallpaper upload will replace this later.
    const url = URL.createObjectURL(file)

    setLocalDesktop((current) => ({
      ...current,
      wallpaper: url,
    }))

    // Wallpaper persistence will be wired to R2 next.
  }

  return (
    <div className="absolute inset-0 z-[300] pointer-events-none">
      <div
        className="pointer-events-auto absolute left-1/2 top-1/2 flex h-[620px] w-[900px] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-xl border border-white/20 shadow-2xl"
        style={{
          backgroundColor: "rgba(15, 23, 42, 0.97)",
          backdropFilter: "blur(24px)",
        }}
      >
        {/* Sidebar */}
        <aside className="flex w-56 shrink-0 flex-col border-r border-white/10">
          {/* Header */}
          <div className="flex h-14 items-center gap-3 border-b border-white/10 px-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-lg">
              ⚙️
            </div>

            <div>
              <div className="text-sm font-semibold text-white">
                LOFTY Settings
              </div>
              <div className="text-[11px] text-white/40">
                Personalize your desktop
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-3">
            <SidebarItem
              icon="🖥️"
              label="Desktop"
              active={section === "desktop"}
              onClick={() => setSection("desktop")}
            />

            <SidebarItem
              icon="▣"
              label="Windows"
              active={section === "windows"}
              onClick={() => setSection("windows")}
            />

            <SidebarItem
              icon="▰"
              label="Taskbar"
              active={section === "taskbar"}
              onClick={() => setSection("taskbar")}
            />

            <SidebarItem
              icon="⊞"
              label="Icons"
              active={section === "icons"}
              onClick={() => setSection("icons")}
            />
          </nav>

          {/* Footer */}
          <div className="border-t border-white/10 p-4">
            <div className="truncate text-xs text-white/40">{desktop.name}</div>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          {/* Window title bar */}
          <div className="flex h-14 items-center justify-between border-b border-white/10 px-5">
            <div>
              <h2 className="text-sm font-semibold text-white">
                {sectionTitle(section)}
              </h2>

              <p className="text-[11px] text-white/40">
                {sectionDescription(section)}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition hover:bg-white/10 hover:text-white"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="h-[calc(100%-56px)] overflow-y-auto p-6">
            {section === "desktop" && (
              <DesktopSection
                theme={theme}
                wallpaper={localDesktop.wallpaper}
                onUpdate={updateTheme}
                onWallpaperChange={handleWallpaperChange}
                saving={saving}
              />
            )}

            {section === "windows" && (
              <WindowsSection
                theme={theme}
                onUpdate={updateTheme}
                saving={saving}
              />
            )}

            {section === "taskbar" && (
              <TaskbarSection
                theme={theme}
                layout={layout}
                onThemeUpdate={updateTheme}
                onLayoutUpdate={updateLayout}
                saving={saving}
              />
            )}

            {section === "icons" && (
              <IconsSection
                layout={layout}
                theme={theme}
                onLayoutUpdate={updateLayout}
                onThemeUpdate={updateTheme}
                saving={saving}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                     */
/* -------------------------------------------------------------------------- */

function SidebarItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: string
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
        active
          ? "bg-white/10 text-white"
          : "text-white/50 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      <span className="w-5 text-center">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

/* -------------------------------------------------------------------------- */
/* Desktop                                                                     */
/* -------------------------------------------------------------------------- */

function DesktopSection({
  theme,
  wallpaper,
  onUpdate,
  onWallpaperChange,
  saving,
}: {
  theme: Desktop["settings"]["theme"]
  wallpaper: string | null
  onUpdate: (updates: Partial<Desktop["settings"]["theme"]>) => Promise<void>
  onWallpaperChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => Promise<void>
  saving: boolean
}) {
  return (
    <div className="space-y-8">
      <SettingsSection
        title="Background"
        description="Choose what your shared desktop looks like."
      >
        {/* Preview */}
        <div
          className="relative h-40 overflow-hidden rounded-xl border border-white/10"
          style={{
            backgroundColor: theme.backgroundColor,
            backgroundImage: wallpaper ? `url(${wallpaper})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-lg border border-white/20 bg-black/20 px-4 py-2 text-xs text-white/70 backdrop-blur">
              LOFTY Desktop
            </div>
          </div>
        </div>

        {/* Background colours */}
        <SettingLabel>Background colour</SettingLabel>

        <div className="mt-3 flex flex-wrap gap-2">
          {BACKGROUND_COLOURS.map((colour) => (
            <ColourButton
              key={colour}
              colour={colour}
              selected={theme.backgroundColor === colour}
              onClick={() =>
                onUpdate({
                  backgroundColor: colour,
                })
              }
            />
          ))}
        </div>

        {/* Custom colour */}
        <div className="mt-4 flex items-center gap-3">
          <input
            type="color"
            value={theme.backgroundColor}
            onChange={(event) =>
              onUpdate({
                backgroundColor: event.target.value,
              })
            }
            className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent"
          />

          <span className="font-mono text-xs text-white/50">
            {theme.backgroundColor}
          </span>
        </div>

        {/* Wallpaper */}
        <div className="mt-6">
          <SettingLabel>Wallpaper</SettingLabel>

          <label className="mt-3 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-white/15 px-4 py-4 text-sm text-white/50 transition hover:border-white/30 hover:bg-white/5 hover:text-white">
            Choose an image
            <input
              type="file"
              accept="image/*"
              onChange={onWallpaperChange}
              className="hidden"
            />
          </label>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Accent"
        description="Used for selections and interactive elements."
      >
        <SettingLabel>Accent colour</SettingLabel>

        <div className="mt-3 flex flex-wrap gap-2">
          {ACCENT_COLOURS.map((colour) => (
            <ColourButton
              key={colour}
              colour={colour}
              selected={theme.accentColor === colour}
              onClick={() =>
                onUpdate({
                  accentColor: colour,
                })
              }
            />
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            type="color"
            value={theme.accentColor}
            onChange={(event) =>
              onUpdate({
                accentColor: event.target.value,
              })
            }
            className="h-9 w-12 cursor-pointer rounded border-0 bg-transparent"
          />

          <span className="font-mono text-xs text-white/50">
            {theme.accentColor}
          </span>
        </div>
      </SettingsSection>

      {saving && <div className="text-xs text-white/30">Saving…</div>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Windows                                                                     */
/* -------------------------------------------------------------------------- */

function WindowsSection({
  theme,
  onUpdate,
  saving,
}: {
  theme: Desktop["settings"]["theme"]
  onUpdate: (updates: Partial<Desktop["settings"]["theme"]>) => Promise<void>
  saving: boolean
}) {
  const styles = [
    {
      value: "classic" as const,
      label: "Classic",
      description: "Dark, solid and familiar.",
    },
    {
      value: "glass" as const,
      label: "Glass",
      description: "Transparent with a frosted effect.",
    },
    {
      value: "flat" as const,
      label: "Flat",
      description: "Minimal and completely opaque.",
    },
    {
      value: "retro" as const,
      label: "Retro",
      description: "Old-school computer aesthetic.",
    },
  ]

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Window style"
        description="Choose how application windows appear on your desktop."
      >
        <div className="grid grid-cols-2 gap-3">
          {styles.map((style) => {
            const selected = theme.windowStyle === style.value

            return (
              <button
                key={style.value}
                type="button"
                onClick={() =>
                  onUpdate({
                    windowStyle: style.value,
                  })
                }
                className={[
                  "rounded-xl border p-4 text-left transition",
                  selected
                    ? "border-white/30 bg-white/10"
                    : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]",
                ].join(" ")}
              >
                <div className="mb-3 h-16 rounded-lg border border-white/10 bg-slate-900/80 p-2">
                  <div className="h-2 w-1/3 rounded bg-white/20" />
                  <div className="mt-2 h-1.5 w-2/3 rounded bg-white/10" />
                  <div className="mt-1.5 h-1.5 w-1/2 rounded bg-white/10" />
                </div>

                <div className="text-sm font-medium text-white">
                  {style.label}
                </div>

                <div className="mt-1 text-xs leading-5 text-white/40">
                  {style.description}
                </div>
              </button>
            )
          })}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Window opacity"
        description="Control how much of the desktop shows through windows."
      >
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0.5"
            max="1"
            step="0.01"
            value={theme.windowOpacity}
            onChange={(event) =>
              onUpdate({
                windowOpacity: Number(event.target.value),
              })
            }
            className="flex-1"
          />

          <span className="w-12 text-right font-mono text-xs text-white/50">
            {Math.round(theme.windowOpacity * 100)}%
          </span>
        </div>
      </SettingsSection>

      {saving && <div className="text-xs text-white/30">Saving…</div>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Taskbar                                                                     */
/* -------------------------------------------------------------------------- */

function TaskbarSection({
  theme,
  layout,
  onThemeUpdate,
  onLayoutUpdate,
  saving,
}: {
  theme: Desktop["settings"]["theme"]
  layout: Desktop["settings"]["layout"]
  onThemeUpdate: (
    updates: Partial<Desktop["settings"]["theme"]>,
  ) => Promise<void>
  onLayoutUpdate: (
    updates: Partial<Desktop["settings"]["layout"]>,
  ) => Promise<void>
  saving: boolean
}) {
  return (
    <div className="space-y-8">
      <SettingsSection
        title="Taskbar style"
        description="Choose how your desktop taskbar behaves."
      >
        <div className="grid grid-cols-3 gap-3">
          {(["classic", "floating", "minimal"] as const).map((style) => (
            <ChoiceButton
              key={style}
              label={capitalize(style)}
              selected={theme.taskbarStyle === style}
              onClick={() =>
                onThemeUpdate({
                  taskbarStyle: style,
                })
              }
            />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Position"
        description="Choose where the taskbar lives."
      >
        <div className="grid grid-cols-2 gap-3">
          {(["bottom", "top"] as const).map((position) => (
            <ChoiceButton
              key={position}
              label={capitalize(position)}
              selected={theme.taskbarPosition === position}
              onClick={() =>
                onThemeUpdate({
                  taskbarPosition: position,
                })
              }
            />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Visibility"
        description="Choose which desktop controls are visible."
      >
        <ToggleRow
          label="Show taskbar"
          description="Display the taskbar on the desktop."
          checked={layout.showTaskbar}
          onChange={(checked) =>
            onLayoutUpdate({
              showTaskbar: checked,
            })
          }
        />

        <ToggleRow
          label="Show clock"
          description="Display the current time."
          checked={layout.showClock}
          onChange={(checked) =>
            onLayoutUpdate({
              showClock: checked,
            })
          }
        />

        <ToggleRow
          label="Show collaborators"
          description="Display people currently on this desktop."
          checked={layout.showCollaborators}
          onChange={(checked) =>
            onLayoutUpdate({
              showCollaborators: checked,
            })
          }
        />
      </SettingsSection>

      {saving && <div className="text-xs text-white/30">Saving…</div>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Icons                                                                       */
/* -------------------------------------------------------------------------- */

function IconsSection({
  layout,
  theme,
  onLayoutUpdate,
  onThemeUpdate,
  saving,
}: {
  layout: Desktop["settings"]["layout"]
  theme: Desktop["settings"]["theme"]
  onLayoutUpdate: (
    updates: Partial<Desktop["settings"]["layout"]>,
  ) => Promise<void>
  onThemeUpdate: (
    updates: Partial<Desktop["settings"]["theme"]>,
  ) => Promise<void>
  saving: boolean
}) {
  return (
    <div className="space-y-8">
      <SettingsSection
        title="Icon size"
        description="Control how large desktop icons appear."
      >
        <div className="grid grid-cols-3 gap-3">
          {(["small", "medium", "large"] as const).map((size) => (
            <ChoiceButton
              key={size}
              label={capitalize(size)}
              selected={layout.iconSize === size}
              onClick={() =>
                onLayoutUpdate({
                  iconSize: size,
                })
              }
            />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Icon spacing"
        description="Control the amount of space between desktop icons."
      >
        <div className="grid grid-cols-3 gap-3">
          {(["compact", "comfortable", "wide"] as const).map((spacing) => (
            <ChoiceButton
              key={spacing}
              label={capitalize(spacing)}
              selected={layout.iconSpacing === spacing}
              onClick={() =>
                onLayoutUpdate({
                  iconSpacing: spacing,
                })
              }
            />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Icon style"
        description="Choose the visual style of desktop icons."
      >
        <div className="grid grid-cols-3 gap-3">
          {(["classic", "minimal", "pixel"] as const).map((style) => (
            <ChoiceButton
              key={style}
              label={capitalize(style)}
              selected={theme.iconStyle === style}
              onClick={() =>
                onThemeUpdate({
                  iconStyle: style,
                })
              }
            />
          ))}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Font"
        description="Choose the typeface used by the desktop."
      >
        <div className="grid grid-cols-3 gap-3">
          {(["system", "mono", "pixel"] as const).map((font) => (
            <ChoiceButton
              key={font}
              label={capitalize(font)}
              selected={theme.font === font}
              onClick={() =>
                onThemeUpdate({
                  font,
                })
              }
            />
          ))}
        </div>
      </SettingsSection>

      {saving && <div className="text-xs text-white/30">Saving…</div>}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Shared components                                                           */
/* -------------------------------------------------------------------------- */

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>

        <p className="mt-1 text-xs text-white/40">{description}</p>
      </div>

      {children}
    </section>
  )
}

function SettingLabel({ children }: { children: React.ReactNode }) {
  return <div className="text-xs font-medium text-white/70">{children}</div>
}

function ColourButton({
  colour,
  selected,
  onClick,
}: {
  colour: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Select ${colour}`}
      className={[
        "h-8 w-8 rounded-full border-2 transition",
        selected ? "scale-110 border-white" : "border-white/10 hover:scale-105",
      ].join(" ")}
      style={{
        backgroundColor: colour,
      }}
    />
  )
}

function ChoiceButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg border px-4 py-3 text-sm transition",
        selected
          ? "border-white/30 bg-white/10 text-white"
          : "border-white/10 bg-white/[0.03] text-white/50 hover:bg-white/[0.06] hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 py-4 last:border-b-0">
      <div>
        <div className="text-sm text-white">{label}</div>

        <div className="mt-1 text-xs text-white/40">{description}</div>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={[
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-white/30" : "bg-white/10",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-4 w-4 rounded-full bg-white transition",
            checked ? "left-6" : "left-1",
          ].join(" ")}
        />
      </button>
    </div>
  )
}

function sectionTitle(section: Section) {
  switch (section) {
    case "desktop":
      return "Desktop"

    case "windows":
      return "Windows"

    case "taskbar":
      return "Taskbar"

    case "icons":
      return "Icons"
  }
}

function sectionDescription(section: Section) {
  switch (section) {
    case "desktop":
      return "Background and colours"

    case "windows":
      return "Window appearance"

    case "taskbar":
      return "Taskbar appearance and visibility"

    case "icons":
      return "Desktop icon appearance"
  }
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
