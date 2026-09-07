import { useState } from "react"

import {
  updateDesktop,
  type Desktop,
  type DesktopSettings,
  type DesktopSettingsUpdate,
} from "../api/desktops"

export function useDesktopSettings(
  desktop: Desktop | null,
  setDesktop: React.Dispatch<React.SetStateAction<Desktop | null>>,
) {
  const [saving, setSaving] = useState(false)

  const settings = desktop?.settings ?? null

  async function updateSettings(updates: DesktopSettingsUpdate) {
    if (!desktop) {
      return
    }

    try {
      setSaving(true)

      const result = await updateDesktop(desktop.id, {
        settings: updates,
      })

      setDesktop(result.desktop)

      return result.desktop.settings
    } finally {
      setSaving(false)
    }
  }

  async function updateTheme(updates: Partial<DesktopSettings["theme"]>) {
    return updateSettings({
      theme: updates,
    })
  }

  async function updateLayout(updates: Partial<DesktopSettings["layout"]>) {
    return updateSettings({
      layout: updates,
    })
  }

  return {
    settings,
    saving,
    updateSettings,
    updateTheme,
    updateLayout,
  }
}
