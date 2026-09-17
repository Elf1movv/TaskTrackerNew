import { useState } from "react"
import { GOAL_COLORS, useGoals, type Goal } from "@/entities/goal"
import { formatDateKey } from "@/shared/lib/date"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { DatePicker } from "@/shared/ui/date-picker"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { Textarea } from "@/shared/ui/textarea"

// Handles both creating a new goal and editing an existing one — pass
// `goal` to pre-fill the fields and save via update instead of create.
// Milestones are managed separately (see features/add-milestone and
// features/milestone-row), not part of this form.
export function GoalForm({ goal, onDone }: { goal?: Goal; onDone: () => void }) {
  const { addGoal, updateGoal } = useGoals()
  const { t } = useLanguage()
  const [title, setTitle] = useState(goal?.title ?? "")
  const [description, setDescription] = useState(goal?.description ?? "")
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? formatDateKey(new Date()))
  const [color, setColor] = useState(goal?.color ?? GOAL_COLORS[0])

  function handleSubmit() {
    if (!title.trim()) return
    const patch = { title: title.trim(), description: description.trim(), targetDate, color }
    if (goal) {
      updateGoal(goal.id, patch)
    } else {
      addGoal(patch)
    }
    onDone()
  }

  return (
    <div className="bg-card border border-primary/25 rounded-2xl p-5 space-y-4">
      <Input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder={t("goalForm.titlePlaceholder")}
        className="border-0 border-b border-border rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary"
      />

      <Textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder={t("goalForm.descriptionPlaceholder")}
        className="text-sm min-h-16 resize-none"
      />

      <div className="flex gap-4 flex-wrap items-center">
        <div className="flex items-center gap-2">
          <Label htmlFor="goal-target-date" className="text-xs text-muted-foreground font-normal">
            {t("goalForm.targetDate")}
          </Label>
          <DatePicker id="goal-target-date" value={targetDate} onChange={setTargetDate} />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("common.color")}</span>
          <div className="flex gap-1.5">
            {GOAL_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                aria-pressed={color === c}
                className="w-6 h-6 rounded-full transition-transform"
                style={{
                  backgroundColor: c,
                  outline: color === c ? `2px solid ${c}` : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onDone} className="text-xs">
          {t("common.cancel")}
        </Button>
        <Button size="sm" onClick={handleSubmit} className="text-xs">
          {goal ? t("common.save") : t("goals.addGoal")}
        </Button>
      </div>
    </div>
  )
}
