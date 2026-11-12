import { useState } from "react"
import type { Category } from "@/entities/category"
import { PALETTE_COLORS } from "@/shared/lib/colors"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover"

// Opened from the colored dot on a category chip: rename + color. A rename
// moves the category's tasks with it (server side, one
// transaction) — added 2026-11-08 so the English default categories of
// older accounts can be renamed without deleting their tasks.
export function CategorySettingsPopover({
  category,
  categories,
  onRename,
  onColor,
}: {
  category: Category
  categories: Category[]
  onRename: (name: string) => void
  onColor: (color: string) => void
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(category.name)
  const trimmed = name.trim()
  const taken = trimmed !== category.name && categories.some(c => c.id !== category.id && c.name === trimmed)
  const canSave = trimmed.length > 0 && trimmed !== category.name && !taken

  return (
    <Popover
      open={open}
      onOpenChange={next => {
        setOpen(next)
        if (next) setName(category.name)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={e => e.stopPropagation()}
          aria-label={t("tasks.categorySettings", { name: category.name })}
          className="size-5 -m-1.5 shrink-0 flex items-center justify-center rounded-full"
        >
          <span
            className="size-2 rounded-full ring-2 ring-white/55"
            style={{ backgroundColor: category.color }}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 space-y-3" align="start">
        <form
          className="space-y-2"
          onSubmit={e => {
            e.preventDefault()
            if (!canSave) return
            onRename(trimmed)
            setOpen(false)
          }}
        >
          <label htmlFor={`category-name-${category.id}`} className="text-meta text-muted-foreground">
            {t("tasks.categoryName")}
          </label>
          <div className="flex gap-2">
            <Input
              id={`category-name-${category.id}`}
              value={name}
              maxLength={100}
              onChange={e => setName(e.target.value)}
              aria-invalid={taken || undefined}
            />
            <Button type="submit" size="sm" className="h-9" disabled={!canSave}>
              {t("common.save")}
            </Button>
          </div>
          {taken && <p className="text-meta text-destructive">{t("tasks.categoryNameTaken")}</p>}
        </form>
        <div className="space-y-2">
          <div className="text-meta text-muted-foreground">{t("common.color")}</div>
          <div className="flex gap-1.5 flex-wrap">
            {PALETTE_COLORS.map(color => (
              <button
                key={color}
                type="button"
                onClick={() => onColor(color)}
                aria-label={`Color ${color}`}
                aria-pressed={category.color === color}
                className="w-5 h-5 rounded-full"
                style={{
                  backgroundColor: color,
                  outline: category.color === color ? "2px solid var(--foreground)" : "none",
                  outlineOffset: 2,
                }}
              />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
