import { WifiOff } from "lucide-react"
import { useLanguage } from "@/shared/lib/i18n"
import { useIsOffline } from "@/shared/lib/pwa"

// The strip under the top bar while the app runs without a network (offline
// view, 2026-11-18): what's on screen is the copy saved on this device, and
// changes are refused until the connection is back.
export function OfflineBanner() {
  const { t } = useLanguage()
  const offline = useIsOffline()
  if (!offline) return null
  return (
    <div
      role="status"
      className="sticky top-[60px] z-20 flex items-center gap-2 border-b border-border bg-[color-mix(in_srgb,var(--warning)_14%,var(--background))] px-4 py-2 text-meta font-semibold text-warning md:top-[68px] md:px-6"
    >
      <WifiOff size={15} aria-hidden className="shrink-0" />
      <span>{t("offline.banner")}</span>
    </div>
  )
}
