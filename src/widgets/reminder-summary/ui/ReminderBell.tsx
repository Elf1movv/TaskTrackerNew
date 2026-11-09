import { useState } from "react"
import { Bell } from "lucide-react"
import { selectVisibleReminders, summarizeReminders, useReminders } from "@/entities/reminder"
import { useLanguage } from "@/shared/lib/i18n"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"
import { ReminderRow } from "./components/ReminderRow"

// Global counterpart to the reminder card on Today — same list rule
// (selectVisibleReminders) and the same row (ReminderRow, compact), so the
// two never disagree again (audit П4 + Д1, 2026-11-09). Always visible
// (fixed-positioned, mounted once in RootLayout, hidden on /today), reads
// reminders itself, no props.
export function ReminderBell() {
  const { reminders } = useReminders()
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const visible = selectVisibleReminders(reminders)
  const { total, critical } = summarizeReminders(reminders)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip delayDuration={1500}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t("reminderSummary.title")}
              className="fixed top-4 right-[58px] md:top-6 md:right-[78px] z-40 flex size-11 items-center justify-center rounded-full bg-card border border-border shadow-card text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell size={18} strokeWidth={1.75} />
              {total > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-5 px-1 rounded-full bg-destructive text-white text-caption font-medium leading-none">
                  {total}
                </span>
              )}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        {total > 0 && <TooltipContent>{t("reminders.badgeTooltip", { total, critical })}</TooltipContent>}
      </Tooltip>

      <PopoverContent align="end" className="w-72">
        <div className="text-meta font-semibold text-muted-foreground mb-3">{t("reminderSummary.title")}</div>
        {visible.length > 0 ? (
          <div className="space-y-3">
            {visible.map(reminder => (
              <ReminderRow key={reminder.id} reminder={reminder} compact onOpenDay={() => setOpen(false)} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-3 text-center">{t("reminders.noRemindersYet")}</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
