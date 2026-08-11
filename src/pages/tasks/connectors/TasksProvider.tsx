import { useMemo, useState, type ReactNode } from "react"
import { useTasks } from "@/entities/task"
import type { StatusFilter } from "@/widgets/task-board"
import { filterTasks } from "../utilits/filterTasks"
import { TasksContext } from "./tasksContext"

export function TasksProvider({ children }: { children: ReactNode }) {
  const { tasks } = useTasks()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  const value = useMemo(
    () => ({
      allTasks: tasks,
      filteredTasks: filterTasks(tasks, statusFilter, categoryFilter),
      statusFilter,
      setStatusFilter,
      categoryFilter,
      setCategoryFilter,
    }),
    [tasks, statusFilter, categoryFilter],
  )

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
