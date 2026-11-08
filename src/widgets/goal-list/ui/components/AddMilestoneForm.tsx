import { useState } from "react"
import { Plus } from "lucide-react"
import { useGoals } from "@/entities/goal"
import { useLanguage } from "@/shared/lib/i18n"
import { Input } from "@/shared/ui/input"

// Inline "add a step" field — for the goal's own steps, a subgoal's steps
// (`subgoalId`), or, with `kind="subgoal"`, a new subgoal of the goal.
export function AddMilestoneForm({
  goalId,
  subgoalId,
  kind = "step",
}: {
  goalId: string
  subgoalId?: string
  kind?: "step" | "subgoal"
}) {
  const { addMilestone, addSubgoal } = useGoals()
  const { t } = useLanguage()
  const [title, setTitle] = useState("")

  function handleSubmit() {
    if (!title.trim()) return
    if (kind === "subgoal") addSubgoal(goalId, title.trim())
    else addMilestone(goalId, title.trim(), subgoalId)
    setTitle("")
  }

  return (
    <div className="flex items-center gap-2 mt-1.5 h-11 pl-3.5 pr-1.5 rounded-[10px] border border-dashed border-border-strong">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSubmit()}
        placeholder={t(kind === "subgoal" ? "goals.addSubgoalPlaceholder" : "goals.addMilestonePlaceholder")}
        className="text-sm h-8 flex-1 bg-transparent border-0 shadow-none px-0"
      />
      <button
        onClick={handleSubmit}
        disabled={!title.trim()}
        className="shrink-0 size-8 rounded-lg bg-primary-soft text-primary disabled:opacity-40 transition-all flex items-center justify-center"
        aria-label={kind === "subgoal" ? "Add subgoal" : "Add milestone"}
      >
        <Plus size={16} />
      </button>
    </div>
  )
}
