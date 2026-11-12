import { Bell, Compass, LogOut, Palette, Settings, User } from "lucide-react"
import { useState } from "react"
import { NotificationsSection } from "@/features/notifications/push"
import { signOut } from "@/shared/lib/auth"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/shared/ui/toggle-group"
import { AccountSection } from "./components/AccountSection"
import { AppearanceSection } from "./components/AppearanceSection"
import { InstallAppButton } from "./components/InstallAppButton"

type SettingsView = "account" | "appearance" | "notifications"

const TABS = [
  { value: "account", icon: User, label: "settings.account.title" },
  { value: "appearance", icon: Palette, label: "settings.menu.appearance" },
  { value: "notifications", icon: Bell, label: "settings.menu.notifications" },
] as const

// One entry point (the gear button, fixed top-right on every authenticated
// page) for a panel meant to grow — a root menu of sections, each one
// level deep. Reachable on every screen width, so it's also how a mobile
// visitor gets to things the desktop sidebar shows directly (language,
// theme, log out) — the sidebar's own footer no longer duplicates them.
// `onRestartOnboarding` comes from app/layouts/RootLayout, which owns the
// onboarding (a widget can't import another widget).
export function SettingsPanel({
  email,
  onRestartOnboarding,
}: {
  email: string
  onRestartOnboarding?: () => void
}) {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<SettingsView>("account")

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("settings.open")}
          data-onboarding="settings-gear"
          className="fixed top-4 right-4 md:top-6 md:right-6 z-40 flex size-11 items-center justify-center rounded-full bg-card border border-border shadow-card text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings size={18} strokeWidth={1.75} />
        </button>
      </SheetTrigger>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>{t("settings.title")}</SheetTitle>
          <SheetDescription className="sr-only">{t("settings.description")}</SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <ToggleGroup
            type="single"
            variant="outline"
            value={view}
            onValueChange={v => v && setView(v as SettingsView)}
            className="w-full"
          >
            {TABS.map(({ value, icon: Icon, label }) => (
              <ToggleGroupItem
                key={value}
                value={value}
                aria-label={t(label)}
                className={`gap-1.5 transition-[flex] ${view === value ? "flex-[3]" : "flex-1"}`}
              >
                <Icon size={14} />
                {/* Three tabs don't fit with full labels: only the open one is named. */}
                {view === value && <span className="truncate">{t(label)}</span>}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="flex-1 overflow-y-auto px-4">
          {view === "account" && <AccountSection email={email} />}
          {view === "appearance" && <AppearanceSection />}
          {view === "notifications" && <NotificationsSection />}
        </div>
        <div className="px-4 pb-4 mt-auto flex flex-col gap-2">
          <InstallAppButton onDone={() => setOpen(false)} />
          {onRestartOnboarding && (
            <Button
              variant="outline"
              className="w-full justify-center"
              onClick={() => {
                setOpen(false)
                onRestartOnboarding()
              }}
            >
              <Compass size={14} />
              {t("settings.restartOnboarding")}
            </Button>
          )}
          <Button
            variant="outline"
            className="w-full justify-center text-muted-foreground hover:text-destructive"
            onClick={() => signOut()}
          >
            <LogOut size={14} />
            {t("sidebar.logout")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
