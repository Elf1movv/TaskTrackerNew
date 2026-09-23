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
  updatedAt: string
  createdAt: string
}
