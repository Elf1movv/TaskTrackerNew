import { CalendarIcon } from "lucide-react"
import { format, parseISO } from "date-fns"
import { formatDateKey } from "@/shared/lib/date"
import { getDateLocale, useLanguage } from "@/shared/lib/i18n"
import { Button } from "./button"
import { Calendar } from "./calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { cn } from "./utils"

// Themed replacement for the native <input type="date"> — built on the
// already-vendored shadcn Calendar+Popover so it matches the app's dark/light
// palette instead of the OS's own date-picker widget.
export function DatePicker({
  id,
  value,
  onChange,
  placeholder,
  className,
}: {
  id?: string
  value: string | null
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  const { language, t } = useLanguage()
  const locale = getDateLocale(language)
  const selected = value ? parseISO(value) : undefined

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "text-xs h-8 justify-start font-normal bg-muted",
            !value && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="size-3.5" />
          {selected ? format(selected, "d MMM yyyy", { locale }) : (placeholder ?? t("taskForm.pickDate"))}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={locale}
          selected={selected}
          defaultMonth={selected}
          onSelect={day => day && onChange(formatDateKey(day))}
        />
      </PopoverContent>
    </Popover>
  )
}
