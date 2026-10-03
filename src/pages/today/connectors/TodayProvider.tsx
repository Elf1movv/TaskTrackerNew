import { useMemo, type ReactNode } from "react"
import { useGoals } from "@/entities/goal"
import { selectTodayHabits, useHabits } from "@/entities/habit"
import { selectUpcomingReminders, useReminders } from "@/entities/reminder"
import { TodayContext } from "./todayContext"

export function TodayProvider({ children }: { children: ReactNode }) {
  const { goals } = useGoals()
  const { habits } = useHabits()
  const { reminders, isLoaded: remindersLoaded } = useReminders()

  const value = useMemo(
    () => ({
      goals: goals.filter(goal => !goal.achievedAt),
      habits: selectTodayHabits(habits),
      reminders: selectUpcomingReminders(reminders),
      remindersLoaded,
    }),
    [goals, habits, reminders, remindersLoaded],
  )

  return <TodayContext.Provider value={value}>{children}</TodayContext.Provider>
}
