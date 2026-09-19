import { useState } from "react"
import { MessageSquarePlus } from "lucide-react"
import { useLanguage } from "@/shared/lib/i18n"
import { FeedbackDialog } from "./FeedbackDialog"

// Temporary beta-testing tool (see LEARNING.md) — flip to false (or delete
// the <FeedbackBanner /> mount in RootLayout.tsx) once the app has been
// battle-tested with real users and this is no longer needed.
const FEEDBACK_BETA_ENABLED = true

export function FeedbackBanner() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)

  if (!FEEDBACK_BETA_ENABLED) return null

  return (
    <>
      <div className="px-6 md:px-10 pb-6 max-w-4xl mx-auto">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <MessageSquarePlus size={14} />
          {t("feedback.bannerLabel")}
        </button>
      </div>
      <FeedbackDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
