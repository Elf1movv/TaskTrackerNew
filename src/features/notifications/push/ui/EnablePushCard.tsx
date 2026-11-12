import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Bell } from "lucide-react"
import { toast } from "sonner"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { usePushNotifications } from "../model/usePushNotifications"

// A one-time offer on Today (owner, 2026-11-12): shown while notifications
// could be turned on but aren't; "Not now" hides it for good on this device.
const dismissKey = (userId: string) => `mytracker-push-offer-dismissed:${userId}`

function readDismissed(userId: string): boolean {
  try {
    return localStorage.getItem(dismissKey(userId)) === "1"
  } catch {
    return false
  }
}

export function EnablePushCard({ userId }: { userId: string }) {
  const { t } = useLanguage()
  const { status, busy, enable } = usePushNotifications()
  const [dismissed, setDismissed] = useState(() => readDismissed(userId))

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(dismissKey(userId), "1")
    } catch {
      // Storage blocked — the card just comes back next visit.
    }
  }

  const visible = status === "off" && !dismissed

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.2 }}
          className="mb-5 overflow-hidden"
        >
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-raised">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Bell size={18} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1 basis-52">
              <div className="text-body font-bold">{t("push.offer.title")}</div>
              <p className="text-meta text-muted-foreground">{t("push.offer.text")}</p>
            </div>
            {/* On a phone the buttons drop under the text instead of squeezing it. */}
            <div className="flex shrink-0 items-center gap-1.5 max-sm:w-full max-sm:justify-end">
              <Button
                size="sm"
                disabled={busy}
                onClick={async () => {
                  const ok = await enable()
                  if (!ok) toast.error(t("push.enableFailed"))
                }}
              >
                {t("push.offer.enable")}
              </Button>
              <Button size="sm" variant="ghost" className="text-muted-foreground" onClick={dismiss}>
                {t("push.offer.later")}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
