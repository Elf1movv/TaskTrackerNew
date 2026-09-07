import { useCallback, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { reorderById } from "@/shared/lib/reorder"
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

  const updateTask = useCallback(
    (id: string, patch: Omit<Task, "id">) => {
      setTasks(ts => ts.map(t => (t.id === id ? { ...patch, id } : t)))
    },
    [setTasks],
  )

  const reorderTasks = useCallback(
    (draggedId: string, targetId: string) => {
      setTasks(ts => reorderById(ts, draggedId, targetId))
    },
    [setTasks],
  )

  const value = useMemo(
    () => ({ tasks, toggleTask, deleteTask, addTask, updateTask, reorderTasks }),
    [tasks, toggleTask, deleteTask, addTask, updateTask, reorderTasks],
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}
