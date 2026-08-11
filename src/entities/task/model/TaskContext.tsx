import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { usePersistedCollection } from "@/shared/lib/storage/usePersistedCollection"
import { taskRepository } from "../api/taskRepository"
import type { Task } from "./types"

interface TaskContextValue {
  tasks: Task[]
  toggleTask: (id: string) => void
  deleteTask: (id: string) => void
  addTask: (task: Omit<Task, "id">) => void
}

const TaskContext = createContext<TaskContextValue | null>(null)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = usePersistedCollection<Task>(taskRepository)

  const toggleTask = useCallback((id: string) => {
    setTasks(ts => ts.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)))
  }, [setTasks])

  const deleteTask = useCallback((id: string) => {
    setTasks(ts => ts.filter(t => t.id !== id))
  }, [setTasks])

  const addTask = useCallback((task: Omit<Task, "id">) => {
    setTasks(ts => [{ ...task, id: generateId() }, ...ts])
  }, [setTasks])

  const value = useMemo(
    () => ({ tasks, toggleTask, deleteTask, addTask }),
    [tasks, toggleTask, deleteTask, addTask],
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}

export function useTasks(): TaskContextValue {
  const ctx = useContext(TaskContext)
  if (!ctx) throw new Error("useTasks must be used within a TaskProvider")
  return ctx
}
