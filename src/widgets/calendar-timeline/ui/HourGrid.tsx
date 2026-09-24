import { useCallback, useEffect, useRef, useState } from "react"
import { format, isToday } from "date-fns"
import { ReminderPriorityIcon, REMINDER_PRIORITY_COLORS, type Reminder } from "@/entities/reminder"
import { PriorityDot, PRIORITY_COLORS, type Task } from "@/entities/task"
import { useDragItem, useDropTarget } from "@/shared/lib/dnd"
import { monoFont } from "@/shared/lib/typography"
import { HOUR_HEIGHT_PX, offsetPxToTime, timeToOffsetPx } from "../lib/timeOffset"

const HOURS = Array.from({ length: 24 }, (_, h) => h)
const GRID_HEIGHT_PX = 24 * HOUR_HEIGHT_PX

export interface HourGridColumn {
  day: Date
  // Only items that have a time — the caller (CalendarDayView/WeekView)
  // splits each day's tasks/reminders into this and AllDayRow's untimed
  // half, same split CalendarDayCell already does for reminders/tasks.
  tasks: Task[]
  reminders: Reminder[]
}

// 24 fixed-height hour rows with tasks/reminders positioned by absolute
// pixel offset from minutesFromMidnight (not a 96-row CSS grid — see
// lib/timeOffset.ts) — generic over N day columns so Day (1) and Week (7)
// share this exact component. Only Tasks are draggable-by-time here: a
// Goal's deadline has day precision everywhere in this app (see
// isGoalDueOnDay), so it never appears in the hour grid at all, only in
// AllDayRow.
export function HourGrid({
  columns,
  onEditTask,
  onEditReminder,
  onRescheduleTask,
}: {
  columns: HourGridColumn[]
  onEditTask: (taskId: string) => void
  onEditReminder: (reminderId: string) => void
  onRescheduleTask: (taskId: string, day: Date, time: string) => void
}) {
  const [now, setNow] = useState(new Date())
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasScrolledToNow = useRef(false)

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Land on roughly the current time instead of midnight, once, on mount —
  // a fresh page always opening scrolled to 00:00 would hide the one part
  // of the day someone actually cares about.
  useEffect(() => {
    if (hasScrolledToNow.current || !scrollRef.current) return
    hasScrolledToNow.current = true
    const container = scrollRef.current
    container.scrollTop = Math.max(0, timeToOffsetPx(format(now, "HH:mm")) - container.clientHeight / 2)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nowTop = timeToOffsetPx(format(now, "HH:mm"))

  return (
    <div ref={scrollRef} className="flex border border-border rounded-2xl overflow-auto max-h-[65vh]">
      <div className="shrink-0 w-12 border-r border-border" style={{ height: GRID_HEIGHT_PX }}>
        {HOURS.map(hour => (
          <div key={hour} className="relative" style={{ height: HOUR_HEIGHT_PX }}>
            <span
              css={monoFont}
              className="absolute -top-[7px] right-1.5 text-[10px] text-muted-foreground bg-card px-0.5"
            >
              {String(hour).padStart(2, "0")}:00
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 flex min-w-0">
        {columns.map(column => (
          <TimelineDayColumn
            key={column.day.toISOString()}
            column={column}
            nowTop={isToday(column.day) ? nowTop : null}
            onEditTask={onEditTask}
            onEditReminder={onEditReminder}
            onRescheduleTask={onRescheduleTask}
          />
        ))}
      </div>
    </div>
  )
}

function TimelineDayColumn({
  column,
  nowTop,
  onEditTask,
  onEditReminder,
  onRescheduleTask,
}: {
  column: HourGridColumn
  nowTop: number | null
  onEditTask: (taskId: string) => void
  onEditReminder: (reminderId: string) => void
  onRescheduleTask: (taskId: string, day: Date, time: string) => void
}) {
  const columnEl = useRef<HTMLDivElement | null>(null)

  // One drop target for the WHOLE column, not one per hour cell — 24
  // nested drop targets inside one column would reproduce the exact
  // double-fire bug `monitor.didDrop()` was added to useDropTarget to fix
  // earlier this session. The drop's Y position (relative to this column's
  // own top edge) is turned into a snapped time here instead.
  const { ref: dropRef, isOver } = useDropTarget<HTMLDivElement>({
    type: "calendar-task-time-move",
    onDrop: (taskId, clientOffset) => {
      if (!clientOffset || !columnEl.current) return
      const rect = columnEl.current.getBoundingClientRect()
      onRescheduleTask(taskId, column.day, offsetPxToTime(clientOffset.y - rect.top))
    },
  })
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      dropRef(node)
      columnEl.current = node
    },
    [dropRef],
  )

  return (
    <div
      ref={ref}
      className={`relative flex-1 min-w-[120px] border-r border-border last:border-r-0 ${
        isOver ? "bg-primary/5" : ""
      }`}
      style={{ height: GRID_HEIGHT_PX }}
    >
      {HOURS.slice(1).map(hour => (
        <div
          key={hour}
          className="absolute inset-x-0 border-t border-border/50"
          style={{ top: hour * HOUR_HEIGHT_PX }}
        />
      ))}

      {nowTop !== null && (
        <div className="absolute inset-x-0 z-20 pointer-events-none" style={{ top: nowTop }}>
          <div className="relative">
            <div className="absolute -left-[3px] -top-[3px] size-[7px] rounded-full bg-destructive" />
            <div className="h-px bg-destructive" />
          </div>
        </div>
      )}

      {column.tasks.map(task => (
        <TimedTaskBlock key={task.id} task={task} onEdit={() => onEditTask(task.id)} />
      ))}
      {column.reminders.map(reminder => (
        <TimedReminderBlock
          key={reminder.id}
          reminder={reminder}
          onEdit={() => onEditReminder(reminder.id)}
        />
      ))}
    </div>
  )
}

// Fixed block height — this app has no end-time/duration for tasks or
// reminders, only a start time, so blocks can't stretch to represent a
// duration. Two items at the same time will visually overlap; a real
// side-by-side lane layout is a much bigger feature than was asked for
// here, so it's left as a known limitation for this personal-scale app.
const BLOCK_HEIGHT_PX = 22

function TimedTaskBlock({ task, onEdit }: { task: Task; onEdit: () => void }) {
  const { ref, isDragging } = useDragItem<HTMLButtonElement>({ type: "calendar-task-time-move", id: task.id })
  return (
    <button
      ref={ref}
      onClick={onEdit}
      style={{
        top: timeToOffsetPx(task.time!),
        height: BLOCK_HEIGHT_PX,
        opacity: isDragging ? 0.4 : 1,
        borderLeftColor: PRIORITY_COLORS[task.priority],
      }}
      className={`absolute left-1 right-1 z-10 flex items-center gap-1 rounded-md border-l-2 bg-card px-1.5 text-left text-[11px] shadow-sm cursor-grab active:cursor-grabbing overflow-hidden ${
        task.completed ? "opacity-60" : ""
      }`}
      title={`${task.time} · ${task.title}`}
    >
      <PriorityDot priority={task.priority} size={9} />
      <span css={monoFont} className="shrink-0 text-muted-foreground">
        {task.time}
      </span>
      <span className={`truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
        {task.title}
      </span>
    </button>
  )
}

function TimedReminderBlock({ reminder, onEdit }: { reminder: Reminder; onEdit: () => void }) {
  return (
    <button
      onClick={onEdit}
      style={{
        top: timeToOffsetPx(reminder.time!),
        height: BLOCK_HEIGHT_PX,
        borderLeftColor: REMINDER_PRIORITY_COLORS[reminder.priority],
      }}
      className={`absolute left-1 right-1 z-10 flex items-center gap-1 rounded-md border-l-2 px-1.5 text-left text-[11px] overflow-hidden ${
        reminder.priority === "critical" ? "bg-destructive/10" : "bg-primary/10"
      }`}
      title={`${reminder.time} · ${reminder.title}`}
    >
      <ReminderPriorityIcon priority={reminder.priority} size={9} />
      <span css={monoFont} className="shrink-0 text-muted-foreground">
        {reminder.time}
      </span>
      <span className="truncate">{reminder.title}</span>
    </button>
  )
}
