import { Navigate, useParams } from "react-router"
import { useHabits } from "@/entities/habit"
import { HabitDetail } from "@/widgets/habit-detail"

// /habits/:habitId — one habit's screen (2026-11-16). Waits for the first
// load before deciding the habit doesn't exist (an old link, or a habit just
// deleted), then goes back to the list.
export function HabitDetailPage() {
  const { habitId } = useParams()
  const { habits, isLoaded } = useHabits()
  const habit = habits.find(h => h.id === habitId)

  if (!habit) return isLoaded ? <Navigate to="/habits" replace /> : null

  return (
    <div className="px-4 pt-2 pb-10 md:px-10 md:pt-0">
      <HabitDetail habit={habit} />
    </div>
  )
}
