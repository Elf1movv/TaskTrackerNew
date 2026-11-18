import { useEffect } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Navigate, useLocation, useOutlet } from "react-router"
import { CategoryProvider } from "@/entities/category"
import { GoalProvider } from "@/entities/goal"
import { HabitProvider } from "@/entities/habit"
import { HabitGroupProvider } from "@/entities/habit-group"
import { ReminderProvider } from "@/entities/reminder"
import { NoteProvider } from "@/entities/note"
import { PlanProvider } from "@/entities/calendar-plan"
import { TaskProvider } from "@/entities/task"
import { useLanguage } from "@/shared/lib/i18n"
import { useSession } from "@/shared/lib/auth"
import { markStartedOffline } from "@/shared/lib/pwa"
import { clearAllCaches, readLastUser, saveLastUser, setCacheUser } from "@/shared/lib/storage"
import { usePushSync } from "@/features/notifications/push"
import { CriticalReminderAlert } from "@/widgets/critical-reminder-alert"
import { DueDateReminders } from "@/widgets/due-date-reminders"
import { FeedbackBanner } from "@/widgets/feedback"
import { OnboardingRoot, useOnboarding } from "@/widgets/onboarding"
import { MobileNav, SidebarNav } from "@/widgets/navigation"
import { ReminderBell } from "@/widgets/reminder-summary"
import { SettingsPanel } from "@/widgets/settings-panel"
import { OfflineBanner } from "./OfflineBanner"
import { TopBar } from "./TopBar"

export function RootLayout() {
  const { t } = useLanguage()
  const location = useLocation()
  const element = useOutlet()
  const { data: session, isPending, error } = useSession()
  // Called before the early returns below (hooks can't be skipped); it only
  // starts loading once there is a session.
  const onboarding = useOnboarding(session?.user.id)
  // Push notifications: refresh this browser's subscription on the server.
  usePushSync(session?.user.id)

  // Offline view (2026-11-18): the login check couldn't reach the server, but
  // this device still has the last person's saved data (they never logged
  // out) — open the app on that copy, read-only (shared/lib/pwa/networkStatus).
  const lastUser = !isPending && !session && error ? readLastUser() : null
  const startsOffline = lastUser !== null
  useEffect(() => {
    if (startsOffline) markStartedOffline()
  }, [startsOffline])

  // isPending: session is still being fetched — render nothing rather than
  // flash the login page before the real answer arrives.
  if (isPending) return null
  // The login check couldn't reach the server (no network, or the server is
  // down). The page itself may have come from the phone's copy (public/sw.js),
  // so without this a person with no signal would land on the login screen as
  // if logged out. Show the "No connection" page instead (2026-11-15).
  // No saved data to show either: the "No connection" page (2026-11-15).
  if (!session && error && !lastUser) {
    window.location.replace(`/offline.html?from=${encodeURIComponent(location.pathname + location.search)}`)
    return null
  }
  if (!session && !lastUser) {
    // Logged out or the session expired: no copy of anyone's data stays on
    // the device (shared/lib/storage/collectionCache.ts).
    clearAllCaches()
    return <Navigate to="/login" replace />
  }
  const user = session ? { id: session.user.id, email: session.user.email } : lastUser!
  if (session) saveLastUser(user)
  // Before the providers below render: they read this person's kept copy.
  setCacheUser(user.id)

  return (
    // Entity providers mounted here, not in AppProviders — they only ever
    // render once a session is confirmed above, so TaskProvider etc. never
    // fire their usePersistedCollection fetch on /login and get a 401.
    // LanguageProvider (in AppProviders, an ancestor of this component) is
    // still above these — usePersistedCollection's error toasts call
    // useLanguage() to translate, and need it as an ancestor.
    <TaskProvider>
      <PlanProvider>
        <NoteProvider>
          <GoalProvider>
            <HabitProvider>
              <HabitGroupProvider>
                <CategoryProvider>
                  <ReminderProvider>
                    <div className="flex h-screen bg-background text-foreground overflow-hidden">
                      <SidebarNav />
                      <DueDateReminders userId={user.id} />
                      <CriticalReminderAlert userId={user.id} />

                      {/* The bottom padding clears the phone nav bar plus the
                          iPhone home-indicator strip under it (MobileNav). */}
                      <main className="flex-1 overflow-y-auto pb-[calc(4rem+max(0px,calc(env(safe-area-inset-bottom)-20px)))] md:pb-0">
                        <TopBar>
                          {/* No bell on /today — that page has its own (with the
                              same badge) on the goal/reminder swap card, see
                              GoalReminderSwapCard.tsx. */}
                          {location.pathname !== "/today" && <ReminderBell />}
                          <SettingsPanel email={user.email} onRestartOnboarding={onboarding.restart} />
                        </TopBar>
                        <OfflineBanner />
                        {import.meta.env.VITE_APP_ENV === "staging" && (
                          <div className="m-4 rounded-lg bg-primary-soft text-primary px-4 py-2 text-sm">
                            {t("app.staging")}
                          </div>
                        )}
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
                      <OnboardingRoot ob={onboarding} />
                    </div>
                  </ReminderProvider>
                </CategoryProvider>
              </HabitGroupProvider>
            </HabitProvider>
          </GoalProvider>
        </NoteProvider>
      </PlanProvider>
    </TaskProvider>
  )
}
