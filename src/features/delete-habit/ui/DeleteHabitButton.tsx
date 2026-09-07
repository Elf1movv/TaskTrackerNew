import { Trash2 } from "lucide-react"
import { useHabits } from "@/entities/habit"

export function DeleteHabitButton({ habitId }: { habitId: string }) {
  const { deleteHabit } = useHabits()

  return (
    <button
      onClick={e => {
        e.stopPropagation()
        deleteHabit(habitId)
      }}
      className="p-1 rounded text-muted-foreground hover:text-destructive transition-all"
      aria-label="Delete habit"
    >
      <Trash2 size={12} />
    </button>
  )
}
