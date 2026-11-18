import { forwardRef } from "react"
import { GripVertical } from "lucide-react"
import { useLanguage } from "@/shared/lib/i18n"

// The six-dot handle of a habit row on the phone (owner 2026-11-18, "как в
// заметках"): only this picks the row up, so a tap anywhere else still marks
// the day or opens the habit. touch-none: a press here never scrolls the page.
export const HabitDragHandle = forwardRef<HTMLButtonElement>(function HabitDragHandle(_, ref) {
  const { t } = useLanguage()
  return (
    <button
      ref={ref}
      type="button"
      aria-label={t("habits.dragHabit")}
      title={t("habits.dragHabit")}
      className="-ml-1 flex h-9 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-tertiary"
    >
      <GripVertical size={16} />
    </button>
  )
})
