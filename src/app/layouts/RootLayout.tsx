import { AnimatePresence, motion } from "motion/react"
import { useLocation, useOutlet } from "react-router"
import { MobileNav, SidebarNav } from "@/widgets/navigation"

export function RootLayout() {
  const location = useLocation()
  const element = useOutlet()

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <SidebarNav />

      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            {element}
          </motion.div>
        </AnimatePresence>
      </main>

      <MobileNav />
    </div>
  )
}
