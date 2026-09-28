import { useEffect, useMemo, useRef, useState } from "react"
import { format, isToday } from "date-fns"
import { resolveCategoryColor, useCategories, type Category } from "@/entities/category"
import { REMINDER_BORDER_COLORS, ReminderPriorityIcon, type Reminder } from "@/entities/reminder"
import { PriorityDot, type Task } from "@/entities/task"
import { TaskToggleCheckbox } from "@/features/toggle-task"
import { formatDateKey } from "@/shared/lib/date"
import { monoFont } from "@/shared/lib/typography"
import {
  DEFAULT_BLOCK_MINUTES,
  HOUR_HEIGHT_PX,
  minutesFromMidnight,
  timeToOffsetPx,
} from "@/shared/lib/timeOffset"
import { computeLanes, type LaneAssignment } from "../lib/computeLanes"
import { useCreateDrag } from "../lib/useCreateDrag"
import { useMoveDrag, type MoveDragPreview } from "../lib/useMoveDrag"
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
  // filters each day's tasks/reminders down to this; an untimed one isn't
  // shown anywhere in Day/Week at all (no all-day strip exists to hold it
  // — see CalendarDayView's comment), same split CalendarDayCell already
  // does for reminders/tasks in Month.
  tasks: Task[]
  reminders: Reminder[]
}

// 24 fixed-height hour rows with tasks/reminders positioned by absolute
// pixel offset from minutesFromMidnight (not a 96-row CSS grid — see
// shared/lib/timeOffset.ts) — generic over N day columns so Day (1) and Week (7)
// share this exact component. Only Tasks are draggable-by-time/resizable
// here: a Goal's deadline has day precision everywhere in this app (see
// isGoalDueOnDay), so it never appears in the hour grid at all; Reminders
// keep a single point in time, no resize handle.
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
  const { categories } = useCategories()
  const [now, setNow] = useState(new Date())
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasScrolledToNow = useRef(false)
  // Lifted up here, not owned by one TimelineDayColumn — a move-drag's
  // live preview can land in a DIFFERENT day column than the one it
  // started in (dragging across days in Week view), so whichever column
  // it currently belongs to is decided by comparing `movePreview.day`
  // against each column's own day when rendering, not by which column's
  // own gesture produced it.
  const [movePreview, setMovePreview] = useState<MoveDragPreview | null>(null)

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
    <div
      ref={scrollRef}
      className="flex bg-card border border-card-border rounded-xl shadow-card overflow-auto max-h-[65vh]"
    >
      <div className="shrink-0 w-12 border-r border-border" style={{ height: GRID_HEIGHT_PX }}>
        {HOURS.map(hour => (
          <div key={hour} className="relative" style={{ height: HOUR_HEIGHT_PX }}>
            <span
              css={monoFont}
              className="absolute -top-[7px] right-1.5 text-[10px] font-bold text-tertiary bg-card px-0.5"
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
            categories={categories}
            nowTop={isToday(column.day) ? nowTop : null}
            movePreview={movePreview?.day === formatDateKey(column.day) ? movePreview : null}
            onMovePreviewChange={setMovePreview}
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
  categories,
  nowTop,
  movePreview,
  onMovePreviewChange,
  onEditTask,
  onEditReminder,
  onRescheduleTask,
  onResizeTask,
  onCreateDraft,
}: {
  column: HourGridColumn
  categories: Category[]
  nowTop: number | null
  // Already filtered to this column by HourGrid (movePreview.day matched
  // against this column's own day) — null here just means "no move-drag
  // is currently over ME", not "no move-drag is happening at all".
  movePreview: MoveDragPreview | null
  onMovePreviewChange: (preview: MoveDragPreview | null) => void
  onEditTask: (taskId: string, anchorRect: DOMRect) => void
  onEditReminder: (reminderId: string, anchorRect: DOMRect) => void
  onRescheduleTask: (taskId: string, day: Date, time: string) => void
  onResizeTask?: (taskId: string, endTime: string) => void
  onCreateDraft?: (day: Date, startTime: string, endTime: string, anchorRect: DOMRect) => void
}) {
  const columnEl = useRef<HTMLDivElement | null>(null)

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

  return (
    <div
      ref={columnEl}
      // Read by useMoveDrag (via document.elementFromPoint + .closest) to
      // find which column the pointer is over mid-drag, without needing a
      // column ref threaded down from HourGrid — see that hook's comment.
      data-calendar-day={formatDateKey(column.day)}
      onPointerDown={onCreateDraft ? onCreatePointerDown : undefined}
      className={`relative flex-1 min-w-[120px] border-r border-border last:border-r-0 ${
        movePreview ? "bg-primary/5" : ""
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

      {preview && <TimePreviewBlock startTime={preview.startTime} endTime={preview.endTime} />}
      {movePreview && <TimePreviewBlock startTime={movePreview.startTime} endTime={movePreview.endTime} />}

      {column.tasks.map(task => (
        <TimedTaskBlock
          key={task.id}
          task={task}
          categoryColor={resolveCategoryColor(task.category, categories)}
          lane={laneById.get(`task:${task.id}`) ?? { id: "", laneIndex: 0, laneCount: 1 }}
          columnRef={columnEl}
          onEdit={rect => onEditTask(task.id, rect)}
          onResizeTask={onResizeTask ? endTime => onResizeTask(task.id, endTime) : undefined}
          onRescheduleTask={onRescheduleTask}
          onMovePreviewChange={onMovePreviewChange}
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

// Dashed "this is where it'll land" outline, shared by create-drag and
// whole-block move — same visual language for both since they answer the
// same question (where does this snap to right now).
function TimePreviewBlock({ startTime, endTime }: { startTime: string; endTime: string }) {
  return (
    <div
      className="absolute left-1 right-1 z-30 rounded-md border-2 border-dashed pointer-events-none"
      style={{
        top: timeToOffsetPx(startTime),
        height: Math.max(4, timeToOffsetPx(endTime) - timeToOffsetPx(startTime)),
        borderColor: "var(--primary)",
        backgroundColor: "var(--primary)",
        opacity: 0.1,
      }}
    />
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

// Same duration a dragged task keeps, used to size the whole-block move's
// live preview (see TimelineDayColumn's movePreview) — mirrors
// blockHeightPx's own fallback for an endTime-less/malformed task.
function taskDurationMinutes(task: Task): number {
  if (!task.endTime || !task.time) return DEFAULT_BLOCK_MINUTES
  const raw = minutesFromMidnight(task.endTime) - minutesFromMidnight(task.time)
  return raw > 0 ? raw : DEFAULT_BLOCK_MINUTES
}

function TimedTaskBlock({
  task,
  categoryColor,
  lane,
  columnRef,
  onEdit,
  onResizeTask,
  onRescheduleTask,
  onMovePreviewChange,
}: {
  task: Task
  categoryColor: string
  lane: LaneAssignment
  columnRef: React.RefObject<HTMLDivElement | null>
  onEdit: (anchorRect: DOMRect) => void
  onResizeTask?: (endTime: string) => void
  onRescheduleTask: (taskId: string, day: Date, time: string) => void
  onMovePreviewChange: (preview: MoveDragPreview | null) => void
}) {
  const {
    onPointerDown: onMovePointerDown,
    isDragging,
    wasDraggedRef,
  } = useMoveDrag({
    taskId: task.id,
    durationMinutes: taskDurationMinutes(task),
    onRescheduleTask,
    onPreviewChange: onMovePreviewChange,
  })
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
      role="button"
      tabIndex={0}
      // Stops the column's create-drag (an ancestor listener) from also
      // starting when the gesture begins on this existing block, then
      // hands off to the whole-block move gesture (useMoveDrag).
      onPointerDown={e => {
        e.stopPropagation()
        onMovePointerDown(e)
      }}
      // The browser fires `click` right after `pointerup` regardless of
      // whether the pointer moved — a plain tap needs this to open the
      // edit popover (useMoveDrag never calls onEdit itself), but a real
      // drag-then-release would ALSO fire one, which must NOT also open
      // the popover right after a successful move. wasDraggedRef is set
      // by useMoveDrag for exactly this check.
      onClick={e => {
        if (wasDraggedRef.current) return
        onEdit(e.currentTarget.getBoundingClientRect())
      }}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") onEdit(e.currentTarget.getBoundingClientRect())
      }}
      style={{
        top: timeToOffsetPx(task.time!),
        height,
        ...laneStyle(lane.laneIndex, lane.laneCount),
        opacity: isDragging ? 0.4 : 1,
        backgroundColor: task.completed
          ? "var(--fill)"
          : `color-mix(in srgb, ${categoryColor} 22%, var(--card))`,
        zIndex: draftEndTime ? 40 : 10,
      }}
      // select-none + touch-callout:none — without these, a press-and-hold
      // to start a move-drag on mobile (see useMoveDrag.ts) is exactly the
      // same gesture Safari/Chrome use for native text selection, which
      // wins by default and highlights the block's text instead of (or
      // alongside) dragging it. touch-none (touch-action: none) is the
      // other half of that same fix, not a nice-to-have — without it the
      // browser still owns deciding what a touch-drag on this element
      // means (pan the page vs. select vs. hand it to JS) and, once
      // selection was ruled out by select-none alone, started treating the
      // gesture as a page scroll instead — our own pointermove/pointerup
      // listeners (usePointerVerticalDrag) never reliably saw the drag at
      // all, so the block stopped moving. touch-action explicitly tells
      // the browser this element has no native touch behavior of its own;
      // JS gets the whole gesture. Direct user feedback, 2026-09-28 (twice
      // — once for the selection, once for this).
      className="absolute flex items-center gap-1 rounded-md px-1.5 text-left text-[11px] shadow-sm cursor-grab active:cursor-grabbing overflow-hidden select-none touch-none [-webkit-touch-callout:none]"
      title={`${task.time} · ${task.title}`}
    >
      <div onPointerDown={e => e.stopPropagation()} onClick={e => e.stopPropagation()}>
        <TaskToggleCheckbox taskId={task.id} completed={task.completed} size={14} />
      </div>
      <PriorityDot
        priority={task.priority}
        size={9}
        colorOverride={task.completed ? "var(--muted-foreground)" : undefined}
      />
      <span css={monoFont} className="shrink-0 text-muted-foreground">
        {task.time}
      </span>
      <span className={`truncate font-semibold ${task.completed ? "line-through text-tertiary" : ""}`}>
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
          // resize). Needs its own, independent stopPropagation. (Also
          // stops the block's own onPointerDown above from starting a
          // move-drag when the gesture begins on this handle instead —
          // both move and resize are plain Pointer Events now, so this
          // one stopPropagation is enough on its own.)
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
        borderColor: REMINDER_BORDER_COLORS[reminder.priority],
      }}
      // Full border (not just a left stripe) + neutral fill — stays
      // distinguishable from a task's colored fill even when a category
      // color happens to be yellow/red-ish, per explicit user feedback.
      className="absolute z-10 flex items-center gap-1 rounded-full border-2 bg-card px-1.5 text-left text-[11px] overflow-hidden"
      title={`${reminder.time} · ${reminder.title}`}
    >
      <ReminderPriorityIcon
        priority={reminder.priority}
        size={9}
        colorOverride={REMINDER_BORDER_COLORS[reminder.priority]}
      />
      <span css={monoFont} className="shrink-0 text-muted-foreground font-bold">
        {reminder.time}
      </span>
      <span className="truncate font-semibold">{reminder.title}</span>
    </button>
  )
}
