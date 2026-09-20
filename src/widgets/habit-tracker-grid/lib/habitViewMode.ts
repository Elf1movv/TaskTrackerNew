import { useCallback, useState } from "react"

export type HabitViewMode = "grid" | "list"

const STORAGE_KEY = "mytracker-habit-view"

function readStoredViewMode(): HabitViewMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === "list" ? "list" : "grid"
  } catch {
    return "grid"
  }
}

// Same read/write-with-try/catch shape as the language preference
// (src/shared/lib/i18n/LanguageProvider.tsx) — this is a single widget's own
// UI preference, so a local hook is enough, no app-wide Provider needed.
export function useHabitViewMode() {
  const [viewMode, setViewModeState] = useState<HabitViewMode>(readStoredViewMode)

  const setViewMode = useCallback((next: HabitViewMode) => {
    setViewModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // localStorage can throw in private/blocked-storage contexts — the
      // view still switches for this session, just won't persist.
    }
  }, [])

  return [viewMode, setViewMode] as const
}
