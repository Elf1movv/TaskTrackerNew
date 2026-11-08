import { useMemo, useState, type ReactNode } from "react"
import { useTasks } from "@/entities/task"
import { filterTasks, sortActiveTasks } from "../lib/filterTasks"
import { TasksContext } from "./tasksContext"
const PAGE_SIZE = 10
export function TasksProvider({ children }: { children: ReactNode }) {
  const { tasks } = useTasks()
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [previous, setPrevious] = useState(categoryFilter)
  if (previous !== categoryFilter) {
    setPrevious(categoryFilter)
    setPage(1)
  }
  const value = useMemo(() => {
    const visible = tasks.filter(task => !task.legacyPending)
    const filtered = filterTasks(visible, categoryFilter)
    const completed = filtered
      .filter(task => task.completed)
      .sort(
        (a, b) =>
          (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt) ||
          a.id.localeCompare(b.id),
      )
    const pageCount = Math.max(1, Math.ceil(completed.length / PAGE_SIZE))
    const currentPage = Math.min(page, pageCount)
    return {
      allTasks: visible,
      activeTasks: sortActiveTasks(filtered.filter(task => !task.completed)),
      completedPage: completed.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE),
      completedCount: completed.length,
      categoryFilter,
      setCategoryFilter,
      page: currentPage,
      pageCount,
      setPage,
    }
  }, [tasks, categoryFilter, page])
  if (page !== value.page) setPage(value.page)
  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
