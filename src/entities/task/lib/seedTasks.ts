import { addDays, format } from "date-fns"
import { getTodayKey } from "@/shared/lib/date"
import type { Task } from "../model/types"

const TODAY = getTodayKey()

export const seedTasks: Task[] = [
  { id: "t1", title: "Review Q3 performance metrics", completed: false, priority: "high", category: "Work", dueDate: TODAY },
  { id: "t2", title: "Plan weekend hiking trip", completed: false, priority: "medium", category: "Personal", dueDate: TODAY },
  { id: "t3", title: "Read 30 pages of Deep Work", completed: true, priority: "low", category: "Learning", dueDate: TODAY },
  { id: "t4", title: "Update portfolio website", completed: false, priority: "high", category: "Work", dueDate: format(addDays(new Date(), 2), "yyyy-MM-dd") },
  { id: "t5", title: "Schedule dentist appointment", completed: true, priority: "medium", category: "Health", dueDate: format(addDays(new Date(), -1), "yyyy-MM-dd") },
  { id: "t6", title: "Write weekly team newsletter", completed: false, priority: "medium", category: "Work", dueDate: format(addDays(new Date(), 3), "yyyy-MM-dd") },
  { id: "t7", title: "Meal prep for the week", completed: false, priority: "low", category: "Health", dueDate: format(addDays(new Date(), 1), "yyyy-MM-dd") },
]
