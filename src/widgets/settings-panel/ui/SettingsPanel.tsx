import { ArrowLeft, Settings } from "lucide-react"
import { useState } from "react"
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
import { AppearanceSection } from "./components/AppearanceSection"
import { SettingsMenu, type SettingsView } from "./components/SettingsMenu"

// One entry point (the gear button, fixed top-right on every authenticated
// page) for a panel meant to grow — a root menu of sections, each one
// level deep. Reachable on every screen width, so it's also how a mobile
// visitor gets to things the desktop sidebar shows directly (language,
// theme, log out) — the sidebar's own footer no longer duplicates them.
export function SettingsPanel({ email }: { email: string }) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<SettingsView | null>(null)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    // Reset to the root menu on close — reopening always starts from the
    // same place, not wherever the user last drilled into.
    if (!next) setView(null)
  }

  const title =
    view === "account"
      ? t("settings.account.title")
      : view === "appearance"
        ? t("settings.menu.appearance")
        : t("settings.title")

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
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
          <div className="flex items-center gap-2">
            {view && (
              <button
                type="button"
                onClick={() => setView(null)}
                aria-label={t("settings.back")}
                className="text-muted-foreground hover:text-foreground -ml-1 p-1"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <SheetTitle>{title}</SheetTitle>
          </div>
          <SheetDescription className="sr-only">{t("settings.description")}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-4">
          {view === "account" && <AccountSection email={email} />}
          {view === "appearance" && <AppearanceSection />}
          {view === null && <SettingsMenu onNavigate={setView} />}
        </div>
      </SheetContent>
    </Sheet>
  )
}
