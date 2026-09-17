import { useMemo, useState, type ReactNode } from "react"
import { useTasks, type StatusFilter } from "@/entities/task"
import { filterTasks } from "../lib/filterTasks"
import { TasksContext } from "./tasksContext"

const COMPLETED_PAGE_SIZE = 10

export function TasksProvider({ children }: { children: ReactNode }) {
  const { tasks } = useTasks()
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [visibleCompletedCount, setVisibleCompletedCount] = useState(COMPLETED_PAGE_SIZE)

  // Reset pagination whenever the filters change, so "load more" clicked on
  // one filter combination doesn't carry over and confuse a different one.
  // Adjusted during render (React's documented pattern for this) rather
  // than in a useEffect, which would cause an extra render pass.
  const [prevFilters, setPrevFilters] = useState([statusFilter, categoryFilter])
  if (prevFilters[0] !== statusFilter || prevFilters[1] !== categoryFilter) {
    setPrevFilters([statusFilter, categoryFilter])
    setVisibleCompletedCount(COMPLETED_PAGE_SIZE)
  }

  const value = useMemo(() => {
    const baseFiltered = filterTasks(tasks, statusFilter, categoryFilter)
    const pending = baseFiltered.filter(t => !t.completed)
    const completedToday = baseFiltered.filter(t => t.completed)
    const visibleCompleted = completedToday.slice(0, visibleCompletedCount)

    return {
      allTasks: tasks,
      filteredTasks: [...pending, ...visibleCompleted],
      statusFilter,
      setStatusFilter,
      categoryFilter,
      setCategoryFilter,
      hasMoreCompleted: completedToday.length > visibleCompletedCount,
      remainingCompletedCount: completedToday.length - visibleCompletedCount,
      onLoadMoreCompleted: () => setVisibleCompletedCount(c => c + COMPLETED_PAGE_SIZE),
    }
  }, [tasks, statusFilter, categoryFilter, visibleCompletedCount])

  return <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
}
