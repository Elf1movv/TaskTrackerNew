export interface Reminder {
  id: string
  title: string
  date: string
  time: string | null
  completed: boolean
  updatedAt: string
}
