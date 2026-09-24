import { CalendarIcon, X } from "lucide-react"
import { format, parseISO } from "date-fns"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { TimePicker } from "./time-picker"
import { cn } from "./utils"

// Replaces a stacked row of separate toggle-buttons (due-date toggle +
// DatePicker + "has time" toggle + two selects + "end time" label +
// another "has time" toggle + two more selects) with ONE compact
// closed-state button showing the resolved summary ("Без срока" / "24
// сент, 19:15–19:45") — click opens a single popover with the calendar
// and time control(s) together. Direct user feedback: the old stacked
// row "looks awful, not user-friendly, too many buttons."
//
// Which sub-fields exist is controlled by which optional props are
// passed: `time`/`onTimeChange` omitted entirely → no time UI at all
// (GoalForm, day-precision only); `endTime`/`onEndTimeChange` omitted →
// start-time only (ReminderForm, no duration concept). TaskForm passes
// all of them. `lockedDate` create-mode flows (ReminderForm's
// day-panel/calendar quick-add) don't use this component at all — they
// render a bare `TimePicker` directly, since there's no date to show or
// pick in that mode; folding a "locked" mode into this component for
// that one caller would overbuild it.
export function DateTimeField({
  id,
  date,
  onDateChange,
  clearable = true,
  placeholder,
  time,
  onTimeChange,
  endTime,
  onEndTimeChange,
  className,
}: {
  id?: string
  date: string | null
  onDateChange: (date: string | null) => void
  clearable?: boolean
  placeholder?: string
  time?: string | null
  onTimeChange?: (time: string | null) => void
  endTime?: string | null
  onEndTimeChange?: (endTime: string | null) => void
  className?: string
}) {
  const { language, t } = useLanguage()
  const locale = getDateLocale(language)
  const selected = date ? parseISO(date) : undefined
  const hasTimeField = onTimeChange !== undefined
  const hasEndTimeField = onEndTimeChange !== undefined

  const summary = selected
    ? [
        format(selected, "d MMM", { locale }),
        hasTimeField && time ? (hasEndTimeField && endTime ? `${time}–${endTime}` : time) : null,
      ]
        .filter(Boolean)
        .join(", ")
    : (placeholder ?? t("taskForm.pickDate"))

  return (
    <Popover>
      {/* asChild renders our own div as the actual trigger element — a
          nested real <button> (the clear "×") inside a Popover's own
          <button> trigger would be invalid HTML, same reason
          TimedTaskBlock's resize handle isn't nested in a <button> either. */}
      <PopoverTrigger asChild>
        <div
          role="button"
          tabIndex={0}
          id={id}
          className={cn(buttonRowClass, !selected && "text-muted-foreground", className)}
        >
          <CalendarIcon className="size-3.5 shrink-0" />
          <span className="truncate">{summary}</span>
          {clearable && selected && (
            <button
              type="button"
              aria-label={t("common.clear")}
              // Independent from the trigger's own click-to-open — a
              // pointerdown-only stopPropagation would NOT be enough
              // here (the browser still fires a separate `click` after
              // mouseup that bubbles on its own path — the exact trap
              // already hit once this session with the resize handle in
              // useResizeDrag.ts), so this needs its own onClick
              // stopPropagation too, not just pointerDown.
              onPointerDown={e => e.stopPropagation()}
              onClick={e => {
                e.stopPropagation()
                onDateChange(null)
              }}
              className="ml-auto -mr-1 rounded p-0.5 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3 space-y-3" align="start">
        <Calendar
          mode="single"
          locale={locale}
          selected={selected}
          defaultMonth={selected}
          onSelect={day => day && onDateChange(formatDateKey(day))}
        />
        {hasTimeField && selected && (
          <div className="flex flex-col gap-2 px-1 pb-1">
            <TimePicker value={time ?? null} onChange={onTimeChange!} />
            {hasEndTimeField && time && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">{t("taskForm.endTime")}</span>
                <TimePicker value={endTime ?? null} onChange={onEndTimeChange!} />
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

// Mirrors Button's outline+sm styling (see shared/ui/button.tsx) rather
// than rendering an actual <button> — this trigger needs a real <button>
// nested inside it for the clear "×" (see PopoverTrigger below), which
// would be invalid HTML inside a <button> itself.
const buttonRowClass =
  "inline-flex items-center gap-1.5 h-8 px-3 rounded-md border bg-muted text-xs font-normal transition-all outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] text-foreground hover:bg-accent hover:text-accent-foreground dark:border-input dark:hover:bg-input/50 cursor-pointer"
