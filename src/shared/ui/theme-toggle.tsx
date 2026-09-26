import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useLanguage } from "@/shared/lib/i18n"
import { ToggleGroup, ToggleGroupItem } from "./toggle-group"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { t } = useLanguage()

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={theme === "dark" ? "dark" : "light"}
      onValueChange={v => v && setTheme(v)}
      className="w-full"
    >
      <ToggleGroupItem value="light" className="flex-1">
        <Sun size={14} />
        {t("sidebar.themeLight")}
      </ToggleGroupItem>
      <ToggleGroupItem value="dark" className="flex-1">
        <Moon size={14} />
        {t("sidebar.themeDark")}
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
