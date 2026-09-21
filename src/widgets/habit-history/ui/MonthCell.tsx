import { format } from "date-fns"
import type { Habit } from "@/entities/habit"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { getMonthCompletionStats } from "../lib/habitCellState"

// Year view — shaded by completion share rather than a binary fill, so
// "half the scheduled days done this month" actually looks different from
// "none" or "all". Not a toggle (marking a whole month done/undone isn't a
// real action) — clicking shows a small popup with the actual numbers
// instead, right next to the cell.
export function MonthCell({ habit, month, today }: { habit: Habit; month: Date; today: Date }) {
  const { t, language } = useLanguage()
  const { done, scheduled } = getMonthCompletionStats(habit, month, today)
  const ratio = scheduled === 0 ? 0 : done / scheduled
  const percent = Math.round(ratio * 100)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={scheduled === 0}
          aria-label={`${habit.title} ${format(month, "LLLL yyyy", { locale: getDateLocale(language) })}`}
          className="size-full rounded-md border transition-transform enabled:hover:scale-105 disabled:cursor-default"
          style={{
            backgroundColor: ratio > 0 ? habit.color : "transparent",
            opacity: ratio > 0 ? 0.25 + ratio * 0.75 : 1,
            borderColor: ratio > 0 ? habit.color : "var(--border)",
          }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-auto px-3 py-2" side="top">
        <div className="text-xs font-medium capitalize mb-0.5">
          {format(month, "LLLL yyyy", { locale: getDateLocale(language) })}
        </div>
        <div css={monoFont} className="text-sm">
          {t("habits.monthCellSummary", { done, scheduled, percent })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
