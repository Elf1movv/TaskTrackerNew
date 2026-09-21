import { Settings } from "lucide-react"
import { useLanguage } from "@/shared/lib/i18n"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet"
import { AccountSection } from "./components/AccountSection"

// One entry point (the gear button, fixed top-right on every authenticated
// page) for a panel meant to grow — AccountSection is the first of what
// will become several `<... Section />` children here over time.
export function SettingsPanel({ email }: { email: string }) {
  const { t } = useLanguage()

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("settings.open")}
          className="fixed top-4 right-4 md:top-6 md:right-6 z-40 flex size-9 items-center justify-center rounded-full bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings size={16} />
        </button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{t("settings.title")}</SheetTitle>
          <SheetDescription className="sr-only">{t("settings.description")}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          <AccountSection email={email} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
