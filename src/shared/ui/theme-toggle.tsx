import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/shared/lib/i18n"
import { Switch } from "./switch"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === "dark"

  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground flex items-center gap-1.5">
        {isDark ? <Moon size={12} /> : <Sun size={12} />}
        {t("sidebar.theme")}
      </span>
      <Switch checked={isDark} onCheckedChange={checked => setTheme(checked ? "dark" : "light")} />
    </div>
  )
}
