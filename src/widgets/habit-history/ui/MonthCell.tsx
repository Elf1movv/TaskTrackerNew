import { format } from "date-fns"
import type { Habit } from "@/entities/habit"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { ProgressRing } from "@/shared/ui/progress-ring"
import { getMonthCompletionStats } from "../lib/habitCellState"

// Year view — the percentage is always visible on the ring itself now (no
// tap needed), so the popup that opens on click only adds what the ring
// can't show: the actual counts behind that percentage. Not a toggle —
// "marking a whole month done" isn't a real action.
export function MonthCell({ habit, month, today }: { habit: Habit; month: Date; today: Date }) {
  const { t, language } = useLanguage()
  const { done, scheduled } = getMonthCompletionStats(habit, month, today)
  const percent = scheduled === 0 ? 0 : Math.round((done / scheduled) * 100)
  const monthLabel = format(month, "LLLL yyyy", { locale: getDateLocale(language) })

  if (scheduled === 0) {
    return (
      <div
        aria-label={`${habit.title} ${monthLabel}`}
        className="size-full rounded-full border border-dashed"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--muted)", opacity: 0.6 }}
      />
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${habit.title} ${monthLabel}`}
          className="size-full rounded-full transition-transform hover:scale-105"
        >
          <ProgressRing progress={percent} color={habit.color} strokeWidth={4} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto px-3 py-2" side="top">
        <div className="text-xs font-medium capitalize mb-0.5">{monthLabel}</div>
        <div css={monoFont} className="text-sm">
          {t("habits.monthCellSummary", { done, scheduled })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
