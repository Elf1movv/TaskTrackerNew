import { useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Plus } from "lucide-react"
import { useSearchParams } from "react-router"
import { NoteForm } from "@/features/note-form"
import { WelcomeBackGreeting } from "@/widgets/onboarding"
import { HabitTrackerGrid } from "@/widgets/habit-tracker-grid"
import { NotesCard } from "@/widgets/notes-card"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { TodayProvider, useTodayContext } from "../connectors"
import { formatHeroDate } from "../lib/formatHeroDate"
import { GoalReminderSwapCard } from "./components"

function TodayPageContent() {
  const { goals, habits, reminders, remindersLoaded } = useTodayContext()
  const { language, t } = useLanguage()
  const heroDate = formatHeroDate(new Date(), language)
  const [isAdding, setIsAdding] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const isWelcomeBack = searchParams.get("welcomeBack") === "1"

  // The first-run walkthrough is no longer tied to "?firstLogin=1" (it's
  // opened by the account's onboarding status, see widgets/onboarding);
  // the param is still cleaned up so it doesn't linger in the address bar.
  function clearGreetingParam() {
    setSearchParams(
      prev => {
        const next = new URLSearchParams(prev)
        next.delete("firstLogin")
        next.delete("welcomeBack")
        return next
      },
      { replace: true },
    )
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-page-sm sm:text-page">{heroDate}</h1>
        <Button
          onClick={() => setIsAdding(v => !v)}
          className="h-11 px-5 gap-2 rounded-md shadow-raised text-body"
        >
          <Plus size={18} />
          {t("notes.add")}
        </Button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden mb-5"
          >
            <NoteForm onDone={() => setIsAdding(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 items-start gap-5 mb-5">
        <NotesCard />
        <GoalReminderSwapCard goals={goals} reminders={reminders} remindersLoaded={remindersLoaded} />
      </div>

      <HabitTrackerGrid habits={habits} />

      {isWelcomeBack && <WelcomeBackGreeting onDone={clearGreetingParam} />}
    </div>
  )
}

export function TodayPage() {
  return (
    <TodayProvider>
      <TodayPageContent />
    </TodayProvider>
  )
}
