import { useState } from "react"
import { Plus } from "lucide-react"
import { useGoals } from "@/entities/goal"
import { useLanguage } from "@/shared/lib/i18n"
import { Input } from "@/shared/ui/input"

export function AddMilestoneForm({ goalId }: { goalId: string }) {
  const { addMilestone } = useGoals()
  const { t } = useLanguage()
  const [title, setTitle] = useState("")

  function handleSubmit() {
    if (!title.trim()) return
    addMilestone(goalId, title.trim())
    setTitle("")
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={title}
        onChange={e => setTitle(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSubmit()}
        placeholder={t("goals.addMilestonePlaceholder")}
        className="text-sm h-8 bg-muted border-0"
      />
      <button
        onClick={handleSubmit}
        disabled={!title.trim()}
        className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-40 transition-all"
        aria-label="Add milestone"
      >
        <Plus size={14} />
      </button>
    </div>
  )
}
