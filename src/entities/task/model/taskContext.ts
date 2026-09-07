import { createContext, useContext } from "react"
import type { Task } from "./task"

export interface TaskContextValue {
  tasks: Task[]
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  addTask: (task: Omit<Task, "id">) => void
  updateTask: (id: string, patch: Omit<Task, "id">) => void
  reorderTasks: (draggedId: string, targetId: string) => void
}

export const TaskContext = createContext<TaskContextValue | null>(null)

export function useTasks(): TaskContextValue {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error("useTasks must be used within a TaskProvider")
  return ctx
}
