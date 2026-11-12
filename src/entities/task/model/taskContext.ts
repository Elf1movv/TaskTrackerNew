import { createContext, useContext } from "react"
import type { Task } from "./task"

export interface TaskContextValue {
  tasks: Task[]
  isLoaded: boolean
  toggleTask: (id: string) => void
  deleteTask: (id: string) => Promise<void>
  // Returns the new task's id.
  addTask: (task: Omit<Task, "id" | "updatedAt" | "completedAt" | "createdAt">) => string
  updateTask: (id: string, patch: Partial<Omit<Task, "id" | "updatedAt">>) => void
  reorderTasks: (draggedId: string, targetId: string) => void
  refreshTasks: () => Promise<void>
}

export const TaskContext = createContext<TaskContextValue | null>(null)

export function useTasks(): TaskContextValue {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error("useTasks must be used within a TaskProvider")
  return ctx
}
