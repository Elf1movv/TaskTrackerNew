import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "./button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === "dark"

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-center text-xs"
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Moon size={12} /> : <Sun size={12} />}
      {isDark ? t("sidebar.themeDark") : t("sidebar.themeLight")}
    </Button>
  )
}
