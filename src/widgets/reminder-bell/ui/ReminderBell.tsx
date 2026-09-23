import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Bell } from "lucide-react"
import { useNavigate } from "react-router"
import {
  ReminderPriorityIcon,
  selectUpcomingReminders,
  summarizeReminders,
  useReminders,
} from "@/entities/reminder"
import { ReminderToggleCheckbox } from "@/features/toggle-reminder"
import { getTodayKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/ui/tooltip"

// Global counterpart to the bell on the Today page's swap card — same
// badge/tooltip, but always visible (fixed-positioned, mounted once in
// RootLayout, same pattern as SettingsPanel) instead of scoped to one
// card on one page. Self-contained: reads reminders itself, no props.
export function ReminderBell() {
  const { reminders } = useReminders()
  const { language, t } = useLanguage()
  const locale = getDateLocale(language)
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const upcoming = selectUpcomingReminders(reminders).filter(r => !r.completed)
  const { total, critical } = summarizeReminders(reminders)

  function goToReminderDay(date: string) {
    setOpen(false)
    navigate(`/calendar?date=${date}`)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip delayDuration={1500}>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={t("reminderSummary.title")}
              className="fixed top-4 right-16 md:top-6 md:right-20 z-40 flex size-9 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
            >
              <Bell size={16} />
              {total > 0 && (
                <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-medium leading-none">
                  {total}
                </span>
              )}
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        {total > 0 && <TooltipContent>{t("reminders.badgeTooltip", { total, critical })}</TooltipContent>}
      </Tooltip>

      <PopoverContent align="end" className="w-72">
        <div css={monoFont} className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground mb-3">
          {t("reminderSummary.title")}
        </div>
        {upcoming.length > 0 ? (
          <div className="space-y-3">
            {upcoming.map(reminder => {
              const dateLabel =
                reminder.date === getTodayKey()
                  ? t("common.today")
                  : format(parseISO(reminder.date), "d MMM", { locale })
              return (
                <div key={reminder.id} className="flex items-center gap-2.5">
                  <span onClick={e => e.stopPropagation()} className="shrink-0">
                    <ReminderToggleCheckbox
                      reminderId={reminder.id}
                      completed={reminder.completed}
                      size={14}
                    />
                  </span>
                  <span className="w-3.5 shrink-0 flex justify-center">
                    <ReminderPriorityIcon priority={reminder.priority} size={12} />
                  </span>
                  <button
                    onClick={() => goToReminderDay(reminder.date)}
                    className="flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <span className="text-xs leading-snug line-clamp-2">{reminder.title}</span>
                  </button>
                  <span css={monoFont} className="text-xs text-muted-foreground shrink-0 text-right">
                    {reminder.time ? `${dateLabel}, ${reminder.time}` : dateLabel}
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-3 text-center">{t("reminders.noRemindersYet")}</p>
        )}
      </PopoverContent>
    </Popover>
  )
}
