import { useState } from "react"
import { HABIT_ICONS, HabitIcon, useHabits, type Habit } from "@/entities/habit"
import { getHabitGroupIcon, getHabitGroupTitle, useHabitGroups } from "@/entities/habit-group"
import { PALETTE_COLORS } from "@/shared/lib/colors"
import { MONDAY_FIRST_WEEKDAYS } from "@/shared/lib/date"
import { getWeekdayLabels, useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { EmojiPicker } from "@/shared/ui/emoji-picker"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6]

// Handles both creating a new habit and editing an existing one — pass
// `habit` to pre-fill the fields and save via update instead of create.
// `lockedGroupId` is for create mode only: when set (adding via a
// specific block's own "+"), the group picker is hidden and the habit is
// created there — mirrors TaskForm's `lockedCategory`. Editing always
// shows the full picker, so a habit can be moved between blocks from the
// form too, not just by dragging.
export function HabitForm({
  habit,
  lockedGroupId,
  onDone,
}: {
  habit?: Habit
  lockedGroupId?: string
  onDone: () => void
}) {
  const { addHabit, updateHabit } = useHabits()
  const { habitGroups } = useHabitGroups()
  const { t, language } = useLanguage()
  const [title, setTitle] = useState(habit?.title ?? "")
  const [icon, setIcon] = useState(habit?.icon ?? "✨")
  const [color, setColor] = useState(habit?.color ?? PALETTE_COLORS[0])
  const [activeDays, setActiveDays] = useState<number[]>(habit?.activeDays ?? ALL_DAYS)
  const [groupId, setGroupId] = useState(habit?.groupId ?? lockedGroupId ?? habitGroups[0]?.id ?? "")
  const showGroupPicker = !!habit || !lockedGroupId
  const weekdayLabels = getWeekdayLabels(language)

  function toggleDay(day: number) {
    setActiveDays(prev => (prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]))
  }

  function handleSubmit() {
    if (!title.trim() || activeDays.length === 0 || !groupId) return
    const patch = { title: title.trim(), icon, color, activeDays, groupId }
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
        <EmojiPicker value={icon} onChange={setIcon} options={HABIT_ICONS} />
        <Input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder={t("habitForm.namePlaceholder")}
          className="border-0 border-b border-border rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary flex-1"
        />
      </div>

      <div className="flex gap-4 flex-wrap items-center">
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

        {/* Blocks as chips, like task categories — the small dropdown was easy
            to miss, and new habits silently landed in "Без блока" (owner,
            2026-11-18). */}
        {showGroupPicker && (
          <div className="flex flex-col gap-1.5" role="radiogroup" aria-label={t("habitForm.group")}>
            <span className="text-xs text-muted-foreground">{t("habitForm.group")}</span>
            <div className="flex flex-wrap gap-1.5">
              {habitGroups.map(g => {
                const selected = g.id === groupId
                return (
                  <button
                    key={g.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setGroupId(g.id)}
                    className={`h-9 px-3 rounded-full border text-meta font-semibold inline-flex items-center gap-1.5 transition-colors ${
                      selected
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted border-border text-foreground"
                    }`}
                  >
                    <HabitIcon emoji={getHabitGroupIcon(g)} size={14} />
                    {g.isGeneral ? t("habits.withoutBlock") : getHabitGroupTitle(g, t)}
                  </button>
                )
              })}
            </div>
          </div>
        )}
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
              className={`size-8 rounded-full text-xs transition ${
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
