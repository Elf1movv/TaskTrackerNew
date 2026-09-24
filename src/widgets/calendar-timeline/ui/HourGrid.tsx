import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { format, isToday } from "date-fns"
import { ReminderPriorityIcon, type Reminder } from "@/entities/reminder"
import { PriorityDot, type Task } from "@/entities/task"
import { ENTITY_TYPE_COLORS } from "@/shared/lib/colors"
import { useDragItem, useDropTarget } from "@/shared/lib/dnd"
import { monoFont } from "@/shared/lib/typography"
import {
  DEFAULT_BLOCK_MINUTES,
  HOUR_HEIGHT_PX,
  minutesFromMidnight,
  offsetPxToTime,
  timeToOffsetPx,
} from "@/shared/lib/timeOffset"
import { computeLanes, type LaneAssignment } from "../lib/computeLanes"
import { useCreateDrag } from "../lib/useCreateDrag"
import { useResizeDrag } from "../lib/useResizeDrag"

const HOURS = Array.from({ length: 24 }, (_, h) => h)
const GRID_HEIGHT_PX = 24 * HOUR_HEIGHT_PX

// Side-by-side positioning for overlapping same-time blocks — see
// computeLanes.ts. `laneCount<=1` reproduces the exact 4px/4px gutter the
// single-item case always had (no visual change for the overwhelmingly
// common non-overlapping case); for laneCount>1 the track between those
// same two 4px outer gutters is split into laneCount equal cells with a
// small 4px gap between adjacent lanes.
const BLOCK_GUTTER_PX = 4
const LANE_GAP_PX = 2

function laneStyle(laneIndex: number, laneCount: number): { left: string; width: string } {
  if (laneCount <= 1) {
    return { left: `${BLOCK_GUTTER_PX}px`, width: `calc(100% - ${BLOCK_GUTTER_PX * 2}px)` }
  }
  const track = `(100% - ${BLOCK_GUTTER_PX * 2}px)`
  return {
    left: `calc(${BLOCK_GUTTER_PX}px + ${track} * ${laneIndex} / ${laneCount} + ${laneIndex * LANE_GAP_PX}px)`,
    width: `calc(${track} / ${laneCount} - ${LANE_GAP_PX}px)`,
  }
}

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
// shared/lib/timeOffset.ts) — generic over N day columns so Day (1) and Week (7)
// share this exact component. Only Tasks are draggable-by-time/resizable
// here: a Goal's deadline has day precision everywhere in this app (see
// isGoalDueOnDay), so it never appears in the hour grid at all, only in
// AllDayRow; Reminders keep a single point in time, no resize handle.
//
// `onCreateDraft`/`onResizeTask` are optional — click/drag-to-create and
// resize are Day-view-only this round (see CalendarWeekView, which simply
// doesn't pass them): when absent, the column attaches no pointerdown
// listener at all and no resize handle is rendered, so Week keeps its
// existing whole-block-move-only behavior unchanged.
export function HourGrid({
  columns,
  onEditTask,
  onEditReminder,
  onRescheduleTask,
  onResizeTask,
  onCreateDraft,
}: {
  columns: HourGridColumn[]
  onEditTask: (taskId: string, anchorRect: DOMRect) => void
  onEditReminder: (reminderId: string, anchorRect: DOMRect) => void
  onRescheduleTask: (taskId: string, day: Date, time: string) => void
  onResizeTask?: (taskId: string, endTime: string) => void
  onCreateDraft?: (day: Date, startTime: string, endTime: string, anchorRect: DOMRect) => void
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
            onResizeTask={onResizeTask}
            onCreateDraft={onCreateDraft}
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
  onResizeTask,
  onCreateDraft,
}: {
  column: HourGridColumn
  nowTop: number | null
  onEditTask: (taskId: string, anchorRect: DOMRect) => void
  onEditReminder: (reminderId: string, anchorRect: DOMRect) => void
  onRescheduleTask: (taskId: string, day: Date, time: string) => void
  onResizeTask?: (taskId: string, endTime: string) => void
  onCreateDraft?: (day: Date, startTime: string, endTime: string, anchorRect: DOMRect) => void
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

  const { onPointerDown: onCreatePointerDown, preview } = useCreateDrag({
    columnRef: columnEl,
    onCreateDraft: (startTime, endTime, anchorRect) => {
      onCreateDraft?.(column.day, startTime, endTime, anchorRect)
    },
  })

  // Tasks and reminders share one combined lane computation (not one per
  // entity type) — the reported bug was specifically a task overlapping a
  // reminder, so they must compete for lanes together. Id-prefixed so a
  // task and a reminder can never collide even if their raw ids happened
  // to match (they're different collections/tables).
  const laneById = useMemo(() => {
    const items = [
      ...column.tasks.map(t => {
        const start = minutesFromMidnight(t.time!)
        return {
          id: `task:${t.id}`,
          startMinutes: start,
          endMinutes: t.endTime ? minutesFromMidnight(t.endTime) : start + DEFAULT_BLOCK_MINUTES,
        }
      }),
      ...column.reminders.map(r => {
        const start = minutesFromMidnight(r.time!)
        return { id: `reminder:${r.id}`, startMinutes: start, endMinutes: start + DEFAULT_BLOCK_MINUTES }
      }),
    ]
    return new Map(computeLanes(items).map(a => [a.id, a]))
  }, [column.tasks, column.reminders])

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
      onPointerDown={onCreateDraft ? onCreatePointerDown : undefined}
      className={`relative flex-1 min-w-[120px] border-r border-border last:border-r-0 ${
        isOver ? "bg-primary/5" : ""
      } ${onCreateDraft ? "cursor-crosshair" : ""}`}
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

      {preview && (
        <div
          className="absolute left-1 right-1 z-30 rounded-md border-2 border-dashed pointer-events-none"
          style={{
            top: timeToOffsetPx(preview.startTime),
            height: Math.max(4, timeToOffsetPx(preview.endTime) - timeToOffsetPx(preview.startTime)),
            borderColor: ENTITY_TYPE_COLORS.task,
            backgroundColor: `${ENTITY_TYPE_COLORS.task}1a`,
          }}
        />
      )}

      {column.tasks.map(task => (
        <TimedTaskBlock
          key={task.id}
          task={task}
          lane={laneById.get(`task:${task.id}`) ?? { id: "", laneIndex: 0, laneCount: 1 }}
          columnRef={columnEl}
          onEdit={rect => onEditTask(task.id, rect)}
          onResizeTask={onResizeTask ? endTime => onResizeTask(task.id, endTime) : undefined}
        />
      ))}
      {column.reminders.map(reminder => (
        <TimedReminderBlock
          key={reminder.id}
          reminder={reminder}
          lane={laneById.get(`reminder:${reminder.id}`) ?? { id: "", laneIndex: 0, laneCount: 1 }}
          onEdit={rect => onEditReminder(reminder.id, rect)}
        />
      ))}
    </div>
  )
}

// Fallback height for a task with no endTime yet (pre-migration data, or
// one created before this feature existed) — unchanged from before this
// round. MIN_BLOCK_HEIGHT_PX floors a real but very short duration so it
// stays legible/clickable rather than collapsing to a sliver.
const FALLBACK_BLOCK_HEIGHT_PX = 22
const MIN_BLOCK_HEIGHT_PX = 18

function blockHeightPx(task: Task): number {
  if (!task.endTime || !task.time) return FALLBACK_BLOCK_HEIGHT_PX
  const raw = timeToOffsetPx(task.endTime) - timeToOffsetPx(task.time)
  return raw > 0 ? Math.max(MIN_BLOCK_HEIGHT_PX, raw) : FALLBACK_BLOCK_HEIGHT_PX
}

function TimedTaskBlock({
  task,
  lane,
  columnRef,
  onEdit,
  onResizeTask,
}: {
  task: Task
  lane: LaneAssignment
  columnRef: React.RefObject<HTMLDivElement | null>
  onEdit: (anchorRect: DOMRect) => void
  onResizeTask?: (endTime: string) => void
}) {
  const { ref, isDragging } = useDragItem<HTMLDivElement>({ type: "calendar-task-time-move", id: task.id })
  const { onPointerDown: onResizePointerDown, draftEndTime } = useResizeDrag({
    startTime: task.time ?? "00:00",
    columnRef,
    onResizeTask: onResizeTask ?? (() => {}),
  })

  const height = draftEndTime
    ? Math.max(MIN_BLOCK_HEIGHT_PX, timeToOffsetPx(draftEndTime) - timeToOffsetPx(task.time!))
    : blockHeightPx(task)

  return (
    // A resize-handle child needs its own pointer handlers, which is
    // invalid nested inside a native <button> (and risks event
    // bubbling/synthetic-click oddities) — role="button" + tabIndex give
    // the same keyboard/a11y affordances instead.
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      // Stops the column's create-drag (an ancestor listener) from also
      // starting when the gesture begins on this existing block.
      onPointerDown={e => e.stopPropagation()}
      onClick={e => onEdit(e.currentTarget.getBoundingClientRect())}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") onEdit(e.currentTarget.getBoundingClientRect())
      }}
      style={{
        top: timeToOffsetPx(task.time!),
        height,
        ...laneStyle(lane.laneIndex, lane.laneCount),
        opacity: isDragging ? 0.4 : 1,
        borderLeftColor: ENTITY_TYPE_COLORS.task,
        zIndex: draftEndTime ? 40 : 10,
      }}
      className={`absolute flex items-center gap-1 rounded-md border-l-2 bg-card px-1.5 text-left text-[11px] shadow-sm cursor-grab active:cursor-grabbing overflow-hidden ${
        task.completed ? "opacity-60" : ""
      }`}
      title={`${task.time} · ${task.title}`}
    >
      <PriorityDot priority={task.priority} size={9} colorOverride={ENTITY_TYPE_COLORS.task} />
      <span css={monoFont} className="shrink-0 text-muted-foreground">
        {task.time}
      </span>
      <span className={`truncate ${task.completed ? "line-through text-muted-foreground" : ""}`}>
        {task.title}
      </span>
      {onResizeTask && (
        <div
          onPointerDown={onResizePointerDown}
          // stopPropagation on pointerdown only stops THAT event from
          // bubbling — it does not suppress the separate `click` event
          // the browser still dispatches after mouseup on this same
          // element, which would otherwise bubble up and fire the
          // block's own onClick (opening the edit popover right after a
          // resize). Needs its own, independent stopPropagation.
          onClick={e => e.stopPropagation()}
          draggable={false}
          className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
        />
      )}
    </div>
  )
}

function TimedReminderBlock({
  reminder,
  lane,
  onEdit,
}: {
  reminder: Reminder
  lane: LaneAssignment
  onEdit: (anchorRect: DOMRect) => void
}) {
  return (
    <button
      onPointerDown={e => e.stopPropagation()}
      onClick={e => onEdit(e.currentTarget.getBoundingClientRect())}
      style={{
        top: timeToOffsetPx(reminder.time!),
        height: FALLBACK_BLOCK_HEIGHT_PX,
        ...laneStyle(lane.laneIndex, lane.laneCount),
        borderLeftColor: ENTITY_TYPE_COLORS.reminder,
      }}
      className="absolute z-10 flex items-center gap-1 rounded-full border-l-2 bg-card px-1.5 text-left text-[11px] overflow-hidden"
      title={`${reminder.time} · ${reminder.title}`}
    >
      <ReminderPriorityIcon
        priority={reminder.priority}
        size={9}
        colorOverride={ENTITY_TYPE_COLORS.reminder}
      />
      <span css={monoFont} className="shrink-0 text-muted-foreground">
        {reminder.time}
      </span>
      <span className="truncate">{reminder.title}</span>
    </button>
  )
}
