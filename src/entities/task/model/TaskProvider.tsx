import { useCallback, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { usePersistedCollection } from "@/shared/lib/storage"
import { taskRepository } from "../api/taskRepository"
import { TaskContext } from "./taskContext"
import type { Task } from "./task"

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = usePersistedCollection<Task>(taskRepository)

  const toggleTask = useCallback(
    (id: string) => {
      setTasks(ts => ts.map(t => (t.id === id ? { ...t, completed: !t.completed } : t)))
    },
    [setTasks],
  )

  const deleteTask = useCallback(
    (id: string) => {
      setTasks(ts => ts.filter(t => t.id !== id))
    },
    [setTasks],
  )

  const addTask = useCallback(
    (task: Omit<Task, "id">) => {
      setTasks(ts => [{ ...task, id: generateId() }, ...ts])
    },
    [setTasks],
  )

  const value = useMemo(
    () => ({ tasks, toggleTask, deleteTask, addTask }),
    [tasks, toggleTask, deleteTask, addTask],
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}
