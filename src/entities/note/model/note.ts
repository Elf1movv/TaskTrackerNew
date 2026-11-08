// Notes are undated quick records on Today (iteration 3, 2026-11-08):
// anything tied to a date is a Reminder, and a note that grows into real
// work moves to Tasks.
export interface Note {
  id: string
  title: string
  completed: boolean
  description: string | null
  archivedAt: string | null
  createdAt: string
  updatedAt: string
}
