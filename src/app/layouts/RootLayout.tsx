import { AnimatePresence, motion } from "motion/react"
import { Navigate, useLocation, useOutlet } from "react-router"
import { CategoryProvider } from "@/entities/category"
import { GoalProvider } from "@/entities/goal"
import { HabitProvider } from "@/entities/habit"
import { TaskProvider } from "@/entities/task"
import { useSession } from "@/shared/lib/auth"
import { DueDateReminders } from "@/widgets/due-date-reminders"
import { FeedbackBanner } from "@/widgets/feedback"
import { MobileNav, SidebarNav } from "@/widgets/navigation"
import { SettingsPanel } from "@/widgets/settings-panel"

export function RootLayout() {
  const location = useLocation()
  const element = useOutlet()
  const { data: session, isPending } = useSession()

  // isPending: session is still being fetched — render nothing rather than
  // flash the login page before the real answer arrives.
  if (isPending) return null
  if (!session) return <Navigate to="/login" replace />

  return (
    // Entity providers mounted here, not in AppProviders — they only ever
    // render once a session is confirmed above, so TaskProvider etc. never
    // fire their usePersistedCollection fetch on /login and get a 401.
    // LanguageProvider (in AppProviders, an ancestor of this component) is
    // still above these — usePersistedCollection's error toasts call
    // useLanguage() to translate, and need it as an ancestor.
    <TaskProvider>
      <GoalProvider>
        <HabitProvider>
          <CategoryProvider>
            <div className="flex h-screen bg-background text-foreground overflow-hidden">
              <SidebarNav />
              <SettingsPanel email={session.user.email} />
              <DueDateReminders userId={session.user.id} />

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
                <FeedbackBanner />
              </main>

              <MobileNav />
            </div>
          </CategoryProvider>
        </HabitProvider>
      </GoalProvider>
    </TaskProvider>
  )
}
