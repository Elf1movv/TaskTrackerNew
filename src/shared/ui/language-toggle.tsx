import { useLanguage } from "@/shared/lib/i18n"
import { ToggleGroup, ToggleGroupItem } from "./toggle-group"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()

  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={language}
      onValueChange={v => v && setLanguage(v as "ru" | "en")}
      className="w-full"
    >
      <ToggleGroupItem value="ru" className="flex-1">
        RU · Русский
      </ToggleGroupItem>
      <ToggleGroupItem value="en" className="flex-1">
        EN · English
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
