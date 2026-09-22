import { createContext, useContext } from "react"
import type { Reminder } from "./reminder"

export interface ReminderContextValue {
  reminders: Reminder[]
  isLoaded: boolean
  addReminder: (reminder: Omit<Reminder, "id" | "updatedAt">) => void
  updateReminder: (id: string, patch: Partial<Omit<Reminder, "id" | "updatedAt">>) => void
  deleteReminder: (id: string) => void
  toggleReminder: (id: string) => void
}

export const ReminderContext = createContext<ReminderContextValue | null>(null)

export function useReminders(): ReminderContextValue {
  const ctx = useContext(ReminderContext)
  if (!ctx) throw new Error("useReminders must be used within a ReminderProvider")
  return ctx
}
