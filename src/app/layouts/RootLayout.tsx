import { AnimatePresence, motion } from "motion/react"
import { Navigate, useLocation, useOutlet } from "react-router"
import { useSession } from "@/shared/lib/auth"
import { MobileNav, SidebarNav } from "@/widgets/navigation"

export function RootLayout() {
  const location = useLocation()
  const element = useOutlet()
  const { data: session, isPending } = useSession()

  // isPending: session is still being fetched — render nothing rather than
  // flash the login page before the real answer arrives.
  if (isPending) return null
  if (!session) return <Navigate to="/login" replace />

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
