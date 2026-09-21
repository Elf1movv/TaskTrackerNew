import { useState } from "react"
import { HABIT_ICONS, useHabits, type Habit } from "@/entities/habit"
import { PALETTE_COLORS } from "@/shared/lib/colors"
import { MONDAY_FIRST_WEEKDAYS } from "@/shared/lib/date"
import { getWeekdayLabels, useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

// Handles both creating a new habit and editing an existing one — pass
// `habit` to pre-fill the fields and save via update instead of create.
export function HabitForm({ habit, onDone }: { habit?: Habit; onDone: () => void }) {
  const { addHabit, updateHabit } = useHabits()
  const { t, language } = useLanguage()
  const [title, setTitle] = useState(habit?.title ?? "")
  const [icon, setIcon] = useState(habit?.icon ?? "✨")
  const [color, setColor] = useState(habit?.color ?? PALETTE_COLORS[0])
  const [activeDays, setActiveDays] = useState<number[]>(habit?.activeDays ?? ALL_DAYS)
  const [isPickingIcon, setIsPickingIcon] = useState(false)
  const weekdayLabels = getWeekdayLabels(language)

  function toggleDay(day: number) {
    setActiveDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]))
  }

  function handleSubmit() {
    if (!title.trim() || activeDays.length === 0) return
    const patch = { title: title.trim(), icon, color, activeDays }
    if (habit) {
      updateHabit(habit.id, patch)
    } else {
      addHabit(patch)
    }
    onDone()
  }

  return (
    <div className="bg-card border border-primary/25 rounded-2xl p-5 space-y-4">
      <div className="flex gap-3 items-center">
        <Popover open={isPickingIcon} onOpenChange={setIsPickingIcon}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-14 h-10 shrink-0 rounded-md bg-muted text-lg hover:bg-accent transition-colors"
              aria-label="Choose icon"
            >
              {icon}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-2">
            <div className="grid grid-cols-8 gap-1">
              {HABIT_ICONS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setIcon(emoji)
                    setIsPickingIcon(false)
                  }}
                  aria-label={`Icon ${emoji}`}
                  aria-pressed={icon === emoji}
                  className={`size-7 flex items-center justify-center rounded text-lg hover:bg-accent transition-colors ${
                    icon === emoji ? "bg-accent" : ""
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
        <Input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder={t("habitForm.namePlaceholder")}
          className="border-0 border-b border-border rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary flex-1"
        />
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground font-normal">{t("common.color")}</Label>
        <div className="flex gap-1.5 flex-wrap">
          {PALETTE_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Color ${c}`}
              aria-pressed={color === c}
              className="w-6 h-6 rounded-full transition-transform"
              style={{
                backgroundColor: c,
                outline: color === c ? "2px solid var(--foreground)" : "none",
                outlineOffset: 2,
              }}
            />
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground font-normal">{t("habitForm.activeDays")}</Label>
        <div className="flex gap-1.5">
          {MONDAY_FIRST_WEEKDAYS.map((day, i) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              aria-pressed={activeDays.includes(day)}
              className={`size-8 rounded-full text-xs transition-all ${
                activeDays.includes(day)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              }`}
            >
              {weekdayLabels[i]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onDone} className="text-xs">
          {t("common.cancel")}
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={activeDays.length === 0} className="text-xs">
          {habit ? t("common.save") : t("habits.addHabit")}
        </Button>
      </div>
    </div>
  )
}
