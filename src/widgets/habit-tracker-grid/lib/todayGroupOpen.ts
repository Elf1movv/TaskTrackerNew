import { useCallback, useState } from "react"

// Today's habit blocks start collapsed (owner feedback 2026-11-08). Opening
// or closing one is remembered per block for the current browser session
// only — sessionStorage, deliberately not localStorage, so a new session
// starts tidy again. try/catch for the same reason as habitViewMode.ts.
const STORAGE_KEY = "mytracker-today-habit-groups-open"

function readOpenMap(): Record<string, boolean> {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}")
    return parsed && typeof parsed === "object" ? parsed : {}
  } catch {
    return {}
  }
}

export function useTodayGroupOpen(groupId: string) {
  const [isOpen, setIsOpenState] = useState(() => readOpenMap()[groupId] === true)
  const setIsOpen = useCallback(
    (open: boolean) => {
      setIsOpenState(open)
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readOpenMap(), [groupId]: open }))
      } catch {
        // Blocked storage: the block still toggles, it just won't be remembered.
      }
    },
    [groupId],
  )
  return [isOpen, setIsOpen] as const
}
