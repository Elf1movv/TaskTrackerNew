export interface Habit {
  id: string
  title: string
  completedDates: string[]
  icon: string
  color: string
  // Days this habit is scheduled on — JS `Date.getDay()` values
  // (0=Sunday..6=Saturday). Defaults to every day.
  activeDays: number[]
  // Every habit belongs to a group — including the auto-seeded "General"
  // one (see entities/habit-group) for habits not in a custom block.
  groupId: string
  // This habit's position within its group on the Today page — independent
  // of the (server-only, never sent to the client) `order` used by the
  // same group on /habits. Set only via HabitProvider's
  // reorderHabitsToday/moveHabitToGroupToday, never via updateHabit.
  todayOrder: number
  updatedAt: string
  createdAt: string
}
