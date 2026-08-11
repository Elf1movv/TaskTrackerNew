import { NavLink } from "react-router"
import { monoFont } from "@/shared/lib/typography"
import { NAV_ITEMS } from "../model/navItems"

export function MobileNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex z-50">
      {NAV_ITEMS.map(({ path, label, Icon }) => (
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
          <span css={monoFont} className="text-[10px]">
            {label}
          </span>
        </NavLink>
      ))}
    </div>
  )
}
