import { NavLink } from "react-router"
import { useLanguage } from "@/shared/lib/i18n"
import { NAV_ITEMS } from "../model/navItems"

export function MobileNav() {
  const { t } = useLanguage()

  return (
    // pb-[env(safe-area-inset-bottom)]: on an iPhone without a Home button the
    // installed app reaches the rounded corners and the home-indicator bar;
    // the icons sit above that strip, the bar's background fills it
    // (owner report, 2026-11-15). 0 everywhere else.
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50 pb-[env(safe-area-inset-bottom)]">
      {NAV_ITEMS.map(({ path, labelKey, Icon }) => (
        <NavLink
          key={path}
          to={path}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`
          }
        >
          <Icon size={18} />
          <span className="tabular-nums text-caption">{t(labelKey)}</span>
        </NavLink>
      ))}
    </div>
  )
}
