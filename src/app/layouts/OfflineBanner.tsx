import { WifiOff } from "lucide-react"
import { useLanguage } from "@/shared/lib/i18n"
import { checkConnection, useIsOffline } from "@/shared/lib/pwa"

// The strip under the top bar while the app runs without a network (offline
// view, 2026-11-18): what's on screen is the copy saved on this device, and
// changes are refused until the connection is back. "Retry" asks the server
// right away (2026-11-19).
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
      <span className="flex-1 min-w-0">{t("offline.banner")}</span>
      {/* The app also checks by itself every few seconds (networkStatus.ts). */}
      <button
        type="button"
        onClick={() => void checkConnection()}
        className="-my-1 h-8 shrink-0 rounded-md px-2.5 text-meta font-bold underline-offset-2 hover:underline"
      >
        {t("offline.retry")}
      </button>
    </div>
  )
}
