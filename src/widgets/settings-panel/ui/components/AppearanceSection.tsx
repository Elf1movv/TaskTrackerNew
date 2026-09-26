import { useLanguage } from "@/shared/lib/i18n"
import { LanguageToggle } from "@/shared/ui/language-toggle"
import { ThemeToggle } from "@/shared/ui/theme-toggle"

export function AppearanceSection() {
  const { t } = useLanguage()

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <span className="text-xs font-bold tracking-[0.06em] uppercase text-tertiary">
          {t("settings.appearance.language")}
        </span>
        <LanguageToggle />
      </div>
      <div className="space-y-2">
        <span className="text-xs font-bold tracking-[0.06em] uppercase text-tertiary">
          {t("settings.appearance.theme")}
        </span>
        <ThemeToggle />
      </div>
    </div>
  )
}
