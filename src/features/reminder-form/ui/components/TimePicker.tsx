import { Button } from "@/shared/ui/button"
import { useLanguage } from "@/shared/lib/i18n"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select"

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
// 5-minute steps — a native minute-by-minute list would be 60 rows, most of
// which nobody actually needs when picking a reminder time.
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"))
const DEFAULT_TIME = "09:00"

// Replaces the native <input type="time"> — its browser-native picker UI
// didn't match the app's theme and looked out of place. Same
// toggle-then-reveal pattern TaskForm/GoalForm already use for optional
// due dates: off by default, "Есть время" reveals the two selects.
export function TimePicker({
  value,
  onChange,
}: {
  value: string | null
  onChange: (value: string | null) => void
}) {
  const { t } = useLanguage()
  const [hour, minute] = (value ?? DEFAULT_TIME).split(":")

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="text-xs h-8"
        onClick={() => onChange(value ? null : DEFAULT_TIME)}
      >
        {value ? t("reminderForm.hasTime") : t("reminderForm.noTime")}
      </Button>
      {value && (
        <div className="flex items-center gap-1">
          <Select value={hour} onValueChange={h => onChange(`${h}:${minute}`)}>
            <SelectTrigger size="sm" className="text-xs h-8 w-[4.5rem] bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HOURS.map(h => (
                <SelectItem key={h} value={h}>
                  {h}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground">:</span>
          <Select value={minute} onValueChange={m => onChange(`${hour}:${m}`)}>
            <SelectTrigger size="sm" className="text-xs h-8 w-[4.5rem] bg-muted">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MINUTES.map(m => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
