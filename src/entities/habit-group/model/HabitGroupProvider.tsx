import { useCallback, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { reorderById } from "@/shared/lib/reorder"
import { usePersistedCollection } from "@/shared/lib/storage"
import { habitGroupRepository } from "../api/habitGroupRepository"
import { HabitGroupContext } from "./habitGroupContext"
import type { HabitGroup } from "./habitGroup"

export function HabitGroupProvider({ children }: { children: ReactNode }) {
  const {
    items: habitGroups,
    isLoaded,
    create,
    update,
    remove,
    reorder,
  } = usePersistedCollection<HabitGroup>(habitGroupRepository, "habitGroup")

  const addHabitGroup = useCallback(
    (group: Omit<HabitGroup, "id" | "updatedAt" | "isGeneral">) => {
      create({ ...group, id: generateId(), isGeneral: false, updatedAt: new Date().toISOString() })
    },
    [create],
  )

  const updateHabitGroup = useCallback(
    (id: string, patch: Partial<Omit<HabitGroup, "id" | "updatedAt" | "isGeneral">>) => update(id, patch),
    [update],
  )

  const deleteHabitGroup = useCallback((id: string) => remove(id), [remove])

  const reorderHabitGroups = useCallback(
    (draggedId: string, targetId: string) => reorder(reorderById(habitGroups, draggedId, targetId)),
    [habitGroups, reorder],
  )

  const value = useMemo(
    () => ({ habitGroups, isLoaded, addHabitGroup, updateHabitGroup, deleteHabitGroup, reorderHabitGroups }),
    [habitGroups, isLoaded, addHabitGroup, updateHabitGroup, deleteHabitGroup, reorderHabitGroups],
  )

  return <HabitGroupContext.Provider value={value}>{children}</HabitGroupContext.Provider>
}
