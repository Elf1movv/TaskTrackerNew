import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "./button"

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const isRu = language === "ru"

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full justify-center text-xs"
      onClick={() => setLanguage(isRu ? "en" : "ru")}
    >
      {isRu ? "RU" : "EN"}
    </Button>
  )
}
