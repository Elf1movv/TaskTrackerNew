import { useMemo, useState, type ReactNode } from "react"
import { useTasks, type StatusFilter, type TaskDateFilter } from "@/entities/task"
import { filterTasks } from "../lib/filterTasks"
import { TasksContext } from "./tasksContext"
const PAGE_SIZE = 10
export function TasksProvider({ children }: { children: ReactNode }) {
  const { tasks } = useTasks()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState<TaskDateFilter>("all")
  const [page, setPage] = useState(1)
  const filterKey = `${statusFilter}:${categoryFilter}:${dateFilter}`
  const [previous, setPrevious] = useState(filterKey)
  if (previous !== filterKey) {
    setPrevious(filterKey)
    setPage(1)
  }
  const value = useMemo(() => {
    const visible = tasks.filter(task => !task.legacyPending)
    const filtered = filterTasks(visible, statusFilter, categoryFilter, dateFilter)
    const pending = filtered.filter(task => !task.completed)
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
      filteredTasks: [...pending, ...completed.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)],
      statusFilter,
      setStatusFilter,
      categoryFilter,
      setCategoryFilter,
      dateFilter,
      setDateFilter,
      page: currentPage,
      pageCount,
      setPage,
    }
  }, [tasks, statusFilter, categoryFilter, dateFilter, page])
  if (page !== value.page) setPage(value.page)
  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
