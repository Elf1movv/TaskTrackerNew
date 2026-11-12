import { useState } from "react"
import { Download, Share, SquarePlus } from "lucide-react"
import { useLanguage } from "@/shared/lib/i18n"
import { usePwaInstall } from "@/shared/lib/pwa"
import { Button } from "@/shared/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog"

// "Install the app" in the settings panel (PWA, 2026-11-12). Android and
// desktop Chrome/Edge get the browser's own install dialog; an iPhone has no
// such dialog, so it gets the two steps of the Share menu. Hidden when the
// app is already installed or the browser can't install sites.
export function InstallAppButton({ onDone }: { onDone: () => void }) {
  const { t } = useLanguage()
  const { mode, promptInstall } = usePwaInstall()
  const [showIosSteps, setShowIosSteps] = useState(false)

  if (!mode) return null

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-center"
        onClick={() => {
          if (mode === "prompt") {
            onDone()
            void promptInstall()
          } else {
            setShowIosSteps(true)
          }
        }}
      >
        <Download size={14} />
        {t("settings.installApp")}
      </Button>
      <Dialog open={showIosSteps} onOpenChange={setShowIosSteps}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("pwa.ios.title")}</DialogTitle>
            <DialogDescription>{t("pwa.ios.description")}</DialogDescription>
          </DialogHeader>
          <ol className="flex flex-col gap-3">
            <Step number={1} icon={<Share size={16} />} text={t("pwa.ios.step1")} />
            <Step number={2} icon={<SquarePlus size={16} />} text={t("pwa.ios.step2")} />
          </ol>
          <DialogFooter>
            <Button onClick={() => setShowIosSteps(false)}>{t("pwa.ios.done")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function Step({ number, icon, text }: { number: number; icon: React.ReactNode; text: string }) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-sunken px-3 py-2.5">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary text-meta font-bold">
        {number}
      </span>
      <span className="text-sm flex-1">{text}</span>
      <span className="text-muted-foreground shrink-0">{icon}</span>
    </li>
  )
}
