import { ChevronRight, LogOut, Palette, User, type LucideIcon } from "lucide-react"
import { signOut } from "@/shared/lib/auth"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"

export type SettingsView = "account" | "appearance"

function MenuRow({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
    >
      <Icon size={15} className="text-muted-foreground" />
      <span className="flex-1 text-left">{label}</span>
      <ChevronRight size={15} className="text-muted-foreground" />
    </button>
  )
}

export function SettingsMenu({ onNavigate }: { onNavigate: (view: SettingsView) => void }) {
  const { t } = useLanguage()

  return (
    <div className="space-y-1">
      <MenuRow icon={User} label={t("settings.account.title")} onClick={() => onNavigate("account")} />
      <MenuRow
        icon={Palette}
        label={t("settings.menu.appearance")}
        onClick={() => onNavigate("appearance")}
      />
      <div className="pt-2 mt-2 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-center text-xs text-muted-foreground hover:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut size={13} />
          {t("sidebar.logout")}
        </Button>
      </div>
    </div>
  )
}
