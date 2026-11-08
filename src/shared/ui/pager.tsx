import { ChevronLeft, ChevronRight } from "lucide-react"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "./button"

// Shared prev / "Page N of M" / next control for short in-card lists (Today's
// notes and reminders, completed tasks). Renders nothing for a single page.
// Pages are 1-based. Arrow buttons (labelled for screen readers) keep it on
// one line even in the narrow Today reminders card. The unused shadcn `pagination.tsx` next to this file is
// link-based with hard-coded English labels, so it isn't used for this.
export function Pager({
  page,
  pageCount,
  onPageChange,
  label,
  className = "",
}: {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  label: string
  className?: string
}) {
  const { t } = useLanguage()
  if (pageCount <= 1) return null
  return (
    <nav className={`flex justify-center items-center gap-2 ${className}`} aria-label={label}>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        aria-label={t("pagination.previous")}
        title={t("pagination.previous")}
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <ChevronLeft size={16} />
      </Button>
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {t("pagination.page", { page, total: pageCount })}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="size-8"
        aria-label={t("pagination.next")}
        title={t("pagination.next")}
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        <ChevronRight size={16} />
      </Button>
    </nav>
  )
}

// Clamp + slice helper shared by the paged lists, so a page that no longer
// exists (an item was deleted or completed) falls back to the last page.
export function paginate<T>(items: T[], page: number, pageSize: number) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, page), pageCount)
  const start = (current - 1) * pageSize
  return { page: current, pageCount, start, items: items.slice(start, start + pageSize) }
}
