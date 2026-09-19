import { CalendarDays, Flame, Layers, Target } from "lucide-react"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/ui/dialog"

const FEATURES = [
  { Icon: Layers, labelKey: "onboarding.welcome.featureTasks" as const },
  { Icon: Target, labelKey: "onboarding.welcome.featureGoals" as const },
  { Icon: Flame, labelKey: "onboarding.welcome.featureHabits" as const },
  { Icon: CalendarDays, labelKey: "onboarding.welcome.featureCalendar" as const },
]

interface WelcomeModalProps {
  open: boolean
  onClose: () => void
}

export function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const { t } = useLanguage()

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{t("onboarding.welcome.title")}</DialogTitle>
          <DialogDescription>{t("onboarding.welcome.body")}</DialogDescription>
        </DialogHeader>
        <ul className="space-y-3 py-1">
          {FEATURES.map(({ Icon, labelKey }) => (
            <li key={labelKey} className="flex items-center gap-3 text-sm">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon size={15} />
              </span>
              {t(labelKey)}
            </li>
          ))}
        </ul>
        <Button className="w-full" onClick={onClose}>
          {t("onboarding.welcome.cta")}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
