import { useState } from "react"
import { HABIT_COLORS, useHabits, type Habit } from "@/entities/habit"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"

// Handles both creating a new habit and editing an existing one — pass
// `habit` to pre-fill the fields and save via update instead of create.
export function HabitForm({ habit, onDone }: { habit?: Habit; onDone: () => void }) {
  const { addHabit, updateHabit } = useHabits()
  const [title, setTitle] = useState(habit?.title ?? "")
  const [icon, setIcon] = useState(habit?.icon ?? "✨")
  const [color, setColor] = useState(habit?.color ?? HABIT_COLORS[0])

  function handleSubmit() {
    if (!title.trim()) return
    const patch = { title: title.trim(), icon: icon.trim() || "✨", color }
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
        <Input
          value={icon}
          onChange={e => setIcon(e.target.value)}
          placeholder="✨"
          maxLength={2}
          className="w-14 text-center text-lg h-10 bg-muted border-0"
          aria-label="Icon (emoji)"
        />
        <Input
          autoFocus
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          placeholder="Habit name"
          className="border-0 border-b border-border rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary flex-1"
        />
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground font-normal">Color</Label>
        <div className="flex gap-1.5">
          {HABIT_COLORS.map(c => (
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

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onDone} className="text-xs">
          Cancel
        </Button>
        <Button size="sm" onClick={handleSubmit} className="text-xs">
          {habit ? "Save" : "Add habit"}
        </Button>
      </div>
    </div>
  )
}
