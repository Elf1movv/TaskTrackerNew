import { createContext, useContext } from "react"
import type { HabitGroup } from "./habitGroup"

export interface HabitGroupContextValue {
  habitGroups: HabitGroup[]
  isLoaded: boolean
  addHabitGroup: (group: Omit<HabitGroup, "id" | "updatedAt" | "isGeneral">) => void
  updateHabitGroup: (id: string, patch: Partial<Omit<HabitGroup, "id" | "updatedAt" | "isGeneral">>) => void
  deleteHabitGroup: (id: string) => void
  reorderHabitGroups: (draggedId: string, targetId: string) => void
}

export const HabitGroupContext = createContext<HabitGroupContextValue | null>(null)

export function useHabitGroups(): HabitGroupContextValue {
  const ctx = useContext(HabitGroupContext)
  if (!ctx) throw new Error("useHabitGroups must be used within a HabitGroupProvider")
  return ctx
}
