import { useCallback, useState } from "react"
import type { HabitHistoryPeriod } from "./periodColumns"

const PERIOD_KEY = "mytracker-habit-period"
const COLLAPSED_KEY = "mytracker-habit-collapsed"
const PERIODS: HabitHistoryPeriod[] = ["day", "week", "month", "year"]

// Same read/write-with-try/catch shape as habit-tracker-grid's
// habitViewMode.ts: a per-device convenience, so a failed read just means the
// default and a failed write just means it isn't remembered.
function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // private/blocked storage — keep working for this visit only
  }
}

// The phone view's one period switch for every block (2026-11-16).
export function useMobilePeriod() {
  const [period, setState] = useState<HabitHistoryPeriod>(() => {
    const stored = read(PERIOD_KEY) as HabitHistoryPeriod | null
    return stored && PERIODS.includes(stored) ? stored : "week"
  })
  const setPeriod = useCallback((next: HabitHistoryPeriod) => {
    setState(next)
    write(PERIOD_KEY, next)
  }, [])
  return [period, setPeriod] as const
}

// Which blocks are collapsed on the phone, by block id.
export function useCollapsedBlocks() {
  const [collapsed, setState] = useState<Record<string, boolean>>(() => {
    try {
      const parsed: unknown = JSON.parse(read(COLLAPSED_KEY) ?? "{}")
      return parsed && typeof parsed === "object" ? (parsed as Record<string, boolean>) : {}
    } catch {
      return {}
    }
  })
  const toggle = useCallback((id: string) => {
    setState(prev => {
      const next = { ...prev, [id]: !prev[id] }
      write(COLLAPSED_KEY, JSON.stringify(next))
      return next
    })
  }, [])
  return [collapsed, toggle] as const
}
