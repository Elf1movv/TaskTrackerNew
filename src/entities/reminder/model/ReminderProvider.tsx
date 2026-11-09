import { useCallback, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { usePersistedCollection } from "@/shared/lib/storage"
import { reminderRepository } from "../api/reminderRepository"
import { ReminderContext } from "./reminderContext"
import type { Reminder } from "./reminder"

export function ReminderProvider({ children }: { children: ReactNode }) {
  const {
    items: reminders,
    isLoaded,
    create,
    update,
    remove,
  } = usePersistedCollection<Reminder>(reminderRepository, "reminder")

  const addReminder = useCallback(
    (reminder: Omit<Reminder, "id" | "updatedAt" | "completedAt">) => {
      create({ ...reminder, id: generateId(), completedAt: null, updatedAt: new Date().toISOString() })
    },
    [create],
  )

  const updateReminder = useCallback(
    (id: string, patch: Partial<Omit<Reminder, "id" | "updatedAt">>) => update(id, patch),
    [update],
  )

  const deleteReminder = useCallback((id: string) => remove(id), [remove])

  const toggleReminder = useCallback(
    (id: string) => {
      const reminder = reminders.find(r => r.id === id)
      if (!reminder) return
      // completedAt is set optimistically so a just-checked reminder stays on
      // screen right away; the server ignores the field and sets its own.
      update(id, {
        completed: !reminder.completed,
        completedAt: reminder.completed ? null : new Date().toISOString(),
      })
    },
    [reminders, update],
  )

  const value = useMemo(
    () => ({ reminders, isLoaded, addReminder, updateReminder, deleteReminder, toggleReminder }),
    [reminders, isLoaded, addReminder, updateReminder, deleteReminder, toggleReminder],
  )

  return <ReminderContext.Provider value={value}>{children}</ReminderContext.Provider>
}
