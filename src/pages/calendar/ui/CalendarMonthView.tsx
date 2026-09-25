import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { CalendarGrid } from "@/widgets/calendar-grid"
import { DayDetailPanel } from "@/widgets/day-detail-panel"
import { CalendarItemPopover, type CalendarItemDraft } from "@/widgets/calendar-item-popover"
import type { Goal } from "@/entities/goal"
import type { Habit } from "@/entities/habit"
import type { Reminder } from "@/entities/reminder"
import type { Task } from "@/entities/task"
import { buildMonthGrid } from "@/shared/lib/calendarGrid"

// The original (and, until this feature, only) calendar view — extracted
// verbatim from CalendarPage.tsx's body when the page grew a view switcher,
// so month behaves exactly as it always did. Builds its own month grid
// from `anchorDate` (see shared/lib/calendarGrid.ts) instead of reading a
// pre-built one from context — every view does this now, the provider no
// longer picks a grid shape on views' behalf.
//
// Lives in pages/calendar, not widgets — it composes two sibling widgets
// (calendar-grid + day-detail-panel + calendar-item-popover), and FSD
// forbids widget-to-widget imports; a component whose whole job is
// combining several widgets belongs at the page layer, which is allowed
// to depend on widgets freely (established precedent in this project —
// see GoalReminderSwapCard).
// Plain props, not context, since CalendarProvider's context is read by
// CalendarPage.tsx itself and threaded down from there.
export function CalendarMonthView({
  anchorDate,
  selectedDay,
  selectedTasks,
  selectedReminders,
  selectedGoals,
  selectedHabits,
  allTasks,
  allReminders,
  onSelectDay,
  onCloseDayPanel,
  onMoveTaskToDay,
  onMoveGoalToDay,
}: {
  anchorDate: Date
  selectedDay: Date | null
  selectedTasks: Task[]
  selectedReminders: Reminder[]
  selectedGoals: Goal[]
  selectedHabits: Habit[]
  allTasks: Task[]
  allReminders: Reminder[]
  onSelectDay: (day: Date, isCurrentMonth: boolean) => void
  onCloseDayPanel: () => void
  onMoveTaskToDay: (taskId: string, day: Date) => void
  onMoveGoalToDay: (goalId: string, day: Date) => void
}) {
  const monthGrid = useMemo(() => buildMonthGrid(anchorDate), [anchorDate])
  const [draft, setDraft] = useState<CalendarItemDraft | null>(null)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  function closeDraft() {
    setDraft(null)
    setAnchorRect(null)
  }

  // Clicking a task row (not the day cell itself, and not its checkbox)
  // opens the same edit popover Day/Week use, anchored at the row — one
  // click to edit, matching their muscle memory, instead of forcing a
  // detour through the day panel first.
  function openEditTask(taskId: string, rect: DOMRect) {
    const task = allTasks.find(t => t.id === taskId)
    if (!task) return
    setDraft({ mode: "edit-task", task })
    setAnchorRect(rect)
  }

  return (
    // No `justify-center` — Day/Week's own convention (fill available
    // width, don't reserve empty side margins). `motion.div layout`
    // already animates the row's total width smoothly when the panel
    // mounts/unmounts; removing the grid's own fixed width just means
    // there's more of that width for it to actually claim.
    <div className="min-w-0">
      <motion.div layout className="flex flex-col lg:flex-row gap-5 items-start w-full">
        <div className="w-full min-w-0 lg:flex-1">
          <CalendarGrid
            days={monthGrid}
            tasks={allTasks}
            reminders={allReminders}
            selectedDay={selectedDay}
            onSelectDay={onSelectDay}
            onMoveTaskToDay={onMoveTaskToDay}
            onMoveGoalToDay={onMoveGoalToDay}
            onEditTask={openEditTask}
          />
        </div>
        <AnimatePresence>
          {selectedDay && (
            // No per-day `key` on purpose — switching between two already-
            // open days should just swap content, not replay the
            // enter/exit animation; that's reserved for null <-> a day.
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.2 }}
              className="w-full lg:w-[260px] shrink-0"
            >
              <DayDetailPanel
                day={selectedDay}
                tasks={selectedTasks}
                reminders={selectedReminders}
                goals={selectedGoals}
                habits={selectedHabits}
                onClose={onCloseDayPanel}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <CalendarItemPopover draft={draft} anchorRect={anchorRect} onClose={closeDraft} />
    </div>
  )
}
