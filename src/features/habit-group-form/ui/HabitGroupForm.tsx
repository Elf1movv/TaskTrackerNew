import { useState } from "react"
import { HABIT_ICONS } from "@/entities/habit"
import { useHabitGroups, type HabitGroup } from "@/entities/habit-group"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { EmojiPicker } from "@/shared/ui/emoji-picker"
import { Input } from "@/shared/ui/input"

// Handles both creating a new block and renaming an existing one — pass
// `group` to pre-fill and save via update instead of create. Never
// rendered for the General group (see HabitGroupAccordionItem).
export function HabitGroupForm({ group, onDone }: { group?: HabitGroup; onDone: () => void }) {
  const { addHabitGroup, updateHabitGroup } = useHabitGroups()
  const { t } = useLanguage()
  const [title, setTitle] = useState(group?.title ?? "")
  const [icon, setIcon] = useState(group?.icon ?? "✨")

  function handleSubmit() {
    if (!title.trim()) return
    const patch = { title: title.trim(), icon }
    if (group) {
      updateHabitGroup(group.id, patch)
    } else {
      addHabitGroup(patch)
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
          placeholder={t("habits.group.titlePlaceholder")}
          className="border-0 border-b border-border rounded-none bg-transparent px-0 shadow-none focus-visible:ring-0 focus-visible:border-primary flex-1"
        />
      </div>

      <div className="flex gap-2 justify-end pt-1">
        <Button variant="ghost" size="sm" onClick={onDone} className="text-xs">
          {t("common.cancel")}
        </Button>
        <Button size="sm" onClick={handleSubmit} className="text-xs">
          {group ? t("common.save") : t("habits.group.addBlock")}
        </Button>
      </div>
    </div>
  )
}
