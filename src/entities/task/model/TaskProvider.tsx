import { useCallback, useMemo, type ReactNode } from "react"
import { generateId } from "@/shared/lib/id"
import { reorderById } from "@/shared/lib/reorder"
import { usePersistedCollection } from "@/shared/lib/storage"
import { taskRepository } from "../api/taskRepository"
import { TaskContext } from "./taskContext"
import type { Task } from "./task"

export function TaskProvider({ children }: { children: ReactNode }) {
  const {
    items: tasks,
    create,
    update,
    remove,
    reorder,
  } = usePersistedCollection<Task>(taskRepository, "task")

  const toggleTask = useCallback(
    (id: string) => {
      const task = tasks.find(t => t.id === id)
      if (!task) return
      update(id, { completed: !task.completed })
    },
    [tasks, update],
  )

  const deleteTask = useCallback((id: string) => remove(id), [remove])

  const addTask = useCallback(
    (task: Omit<Task, "id" | "updatedAt">) => {
      // updatedAt is a placeholder here — usePersistedCollection.create
      // replaces it with the server's real value once the request resolves.
      create({ ...task, id: generateId(), updatedAt: new Date().toISOString() })
    },
    [create],
  )

  const updateTask = useCallback(
    (id: string, patch: Partial<Omit<Task, "id" | "updatedAt">>) => update(id, patch),
    [update],
  )

  const reorderTasks = useCallback(
    (draggedId: string, targetId: string) => reorder(reorderById(tasks, draggedId, targetId)),
    [tasks, reorder],
  )

  const value = useMemo(
    () => ({ tasks, toggleTask, deleteTask, addTask, updateTask, reorderTasks }),
    [tasks, toggleTask, deleteTask, addTask, updateTask, reorderTasks],
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}
