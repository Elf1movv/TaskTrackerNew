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
    isLoaded,
    create,
    update,
    remove,
    reorder,
    refresh,
  } = usePersistedCollection<Task>(taskRepository, "task")

  const toggleTask = useCallback(
    (id: string) => {
      const task = tasks.find(t => t.id === id)
      if (!task) return
      const completed = !task.completed
      update(id, { completed, completedAt: completed ? new Date().toISOString() : null })
    },
    [tasks, update],
  )

  const deleteTask = useCallback((id: string) => remove(id), [remove])

  const addTask = useCallback(
    (task: Omit<Task, "id" | "updatedAt" | "completedAt" | "createdAt">) => {
      // updatedAt/createdAt are placeholders here — usePersistedCollection.
      // create replaces them with the server's real values once the
      // request resolves.
      const now = new Date().toISOString()
      create({ ...task, id: generateId(), updatedAt: now, createdAt: now, completedAt: null })
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
    () => ({
      tasks,
      isLoaded,
      toggleTask,
      deleteTask,
      addTask,
      updateTask,
      reorderTasks,
      refreshTasks: refresh,
    }),
    [tasks, isLoaded, toggleTask, deleteTask, addTask, updateTask, reorderTasks, refresh],
  )

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>
}
