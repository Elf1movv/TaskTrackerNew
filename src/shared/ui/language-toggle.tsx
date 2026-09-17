import { useLanguage } from "@/shared/lib/i18n"
import { Switch } from "./switch"

export function LanguageToggle() {
  const { language, setLanguage, t } = useLanguage()
  const isRu = language === "ru"

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{t("sidebar.language")}</span>
      <div className="flex items-center gap-1.5">
        <span className={`text-[10px] ${isRu ? "text-muted-foreground" : "text-foreground"}`}>EN</span>
        <Switch checked={isRu} onCheckedChange={checked => setLanguage(checked ? "ru" : "en")} />
        <span className={`text-[10px] ${isRu ? "text-foreground" : "text-muted-foreground"}`}>RU</span>
      </div>
    </div>
  )
}
