import { LanguageToggle } from "@/shared/ui/language-toggle"
import { ThemeToggle } from "@/shared/ui/theme-toggle"

export function AppearanceSection() {
  return (
    <div className="space-y-2">
      <LanguageToggle />
      <ThemeToggle />
    </div>
  )
}
