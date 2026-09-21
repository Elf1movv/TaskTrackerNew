import { createContext, useContext } from "react"
import type { Task } from "./task"

export interface TaskContextValue {
  tasks: Task[]
  isLoaded: boolean
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  addTask: (task: Omit<Task, "id" | "updatedAt" | "completedAt" | "createdAt">) => void
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
