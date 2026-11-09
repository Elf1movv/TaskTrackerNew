import { useState } from "react"
import { Plus, X } from "lucide-react"
import { useCategories, type Category } from "@/entities/category"
import { useTasks } from "@/entities/task"
import { PALETTE_COLORS } from "@/shared/lib/colors"
import { useDragReorder } from "@/shared/lib/dnd"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { ConfirmAction } from "@/shared/ui/confirm-action"
import { Input } from "@/shared/ui/input"
import { CategorySettingsPopover } from "./CategorySettingsPopover"

const ALL = "all"

// One category block for both the Tasks and the Goals page (audit Д4 + Л4,
// decision 3, 2026-11-09): filter chips plus full management — add, rename,
// recolor (the colored dot), delete (×, with the task count) and drag a
// chip to a new place. Categories are shared by tasks and goals, so they're
// managed the same way from either page.
// `value` is the selected filter: "all" or a category name. `extraChips`
// are plain filter chips after the categories (Goals: "No category").
export function CategoryChips({
  value,
  onChange,
  extraChips = [],
}: {
  value: string
  onChange: (value: string) => void
  extraChips?: { value: string; label: string }[]
}) {
  const { categories, addCategory, deleteCategory } = useCategories()
  const { tasks } = useTasks()
  const { t } = useLanguage()
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState("")
  const [newColor, setNewColor] = useState(PALETTE_COLORS[0])
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null)

  function create() {
    const name = newName.trim()
    if (!name) return
    addCategory(name, newColor)
    setNewName("")
    setNewColor(PALETTE_COLORS[0])
    setIsAdding(false)
  }

  const taskCount = pendingDelete ? tasks.filter(task => task.category === pendingDelete.name).length : 0

  async function confirmDelete() {
    if (!pendingDelete) return
    const { id, name } = pendingDelete
    setPendingDelete(null)
    await deleteCategory(id)
    if (value === name) onChange(ALL)
    // The server deletes the category's tasks and clears it on goals; the
    // repository's invalidateRelated reloads both collections afterwards.
  }

  const chipClass = (selected: boolean) =>
    `h-8 rounded-full text-meta font-semibold transition ${
      selected
        ? "bg-primary text-primary-foreground border border-primary"
        : "border border-border bg-card text-foreground"
    }`

  return (
    <>
      <div className="flex gap-2 mb-6 flex-wrap items-center">
        <button
          type="button"
          aria-pressed={value === ALL}
          onClick={() => onChange(ALL)}
          className={`${chipClass(value === ALL)} px-3.5`}
        >
          {t("tasks.categoryAll")}
        </button>
        {categories.map(category => (
          <CategoryChip
            key={category.id}
            category={category}
            selected={value === category.name}
            className={chipClass(value === category.name)}
            onSelect={() => onChange(category.name)}
            onRenamed={name => value === category.name && onChange(name)}
            onDelete={() => setPendingDelete(category)}
          />
        ))}
        {extraChips.map(chip => (
          <button
            key={chip.value}
            type="button"
            aria-pressed={value === chip.value}
            onClick={() => onChange(chip.value)}
            className={`${chipClass(value === chip.value)} px-3.5`}
          >
            {chip.label}
          </button>
        ))}
        {isAdding ? (
          <div className="flex items-center gap-2 h-10 pl-2 pr-1.5 rounded-full bg-card border border-primary/25 shadow-card">
            <Input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") create()
                if (e.key === "Escape") setIsAdding(false)
              }}
              placeholder={t("taskForm.newCategoryPlaceholder")}
              className="border-0 shadow-none focus-visible:ring-0 text-sm h-8 w-32 px-2"
            />
            <div className="flex gap-1 flex-wrap max-w-32">
              {PALETTE_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewColor(color)}
                  aria-label={`Color ${color}`}
                  aria-pressed={newColor === color}
                  className="w-4 h-4 rounded-full transition-transform"
                  style={{
                    backgroundColor: color,
                    outline: newColor === color ? "2px solid var(--foreground)" : "none",
                    outlineOffset: 2,
                  }}
                />
              ))}
            </div>
            <Button type="button" className="text-meta font-bold h-8 px-3 rounded-full" onClick={create}>
              {t("common.add")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="text-meta font-semibold h-8 px-2.5 rounded-full"
              onClick={() => setIsAdding(false)}
            >
              {t("common.cancel")}
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="h-8 px-3 rounded-full border border-dashed border-border-strong text-meta font-semibold text-muted-foreground hover:text-foreground transition flex items-center gap-1.5"
          >
            <Plus size={14} />
            {t("tasks.addCategory")}
          </button>
        )}
      </div>

      <ConfirmAction
        open={!!pendingDelete}
        onOpenChange={open => !open && setPendingDelete(null)}
        title={taskCount > 0 ? t("tasks.deleteCategoryTitleWithTasks") : t("tasks.deleteCategoryTitle")}
        description={
          taskCount > 0
            ? t("tasks.deleteCategoryBodyWithTasks", { name: pendingDelete?.name ?? "", count: taskCount })
            : t("tasks.deleteCategoryBody", { name: pendingDelete?.name ?? "" })
        }
        onConfirm={confirmDelete}
      />
    </>
  )
}

// One draggable category chip: the dot opens rename/color, the name selects
// the filter, the × (on hover) asks to delete it.
function CategoryChip({
  category,
  selected,
  className,
  onSelect,
  onRenamed,
  onDelete,
}: {
  category: Category
  selected: boolean
  className: string
  onSelect: () => void
  onRenamed: (name: string) => void
  onDelete: () => void
}) {
  const { categories, updateCategory, reorderCategories } = useCategories()
  const { ref, isDragging } = useDragReorder<HTMLDivElement>({
    type: "category-chip",
    id: category.id,
    onHoverMove: reorderCategories,
  })
  return (
    <div
      ref={ref}
      data-category-chip={category.id}
      className={`relative group flex items-center gap-2 pl-3.5 pr-7 cursor-grab active:cursor-grabbing ${className}`}
      style={{ opacity: isDragging ? 0.4 : 1 }}
    >
      <CategorySettingsPopover
        category={category}
        categories={categories}
        onColor={color => updateCategory(category.id, { color })}
        onRename={name => {
          updateCategory(category.id, { name })
          onRenamed(name)
        }}
      />
      <button type="button" aria-pressed={selected} onClick={onSelect}>
        {category.name}
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete category ${category.name}`}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 size-5 rounded-full border border-border bg-card shadow-card flex items-center justify-center opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
      >
        <X size={9} strokeWidth={3.5} />
      </button>
    </div>
  )
}
