import { useEffect, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { useLanguage, type TranslationKey } from "@/shared/lib/i18n"

const GREETING_KEYS: TranslationKey[] = [
  "onboarding.back.1",
  "onboarding.back.2",
  "onboarding.back.3",
  "onboarding.back.4",
  "onboarding.back.5",
  "onboarding.back.6",
  "onboarding.back.7",
]

interface WelcomeBackGreetingProps {
  onDone: () => void
}

export function WelcomeBackGreeting({ onDone }: WelcomeBackGreetingProps) {
  const { t } = useLanguage()
  // Picked once per mount, not on every render — a fresh mount only ever
  // happens once per login, so this doesn't need to be memoized further.
  const [greetingKey] = useState(() => GREETING_KEYS[Math.floor(Math.random() * GREETING_KEYS.length)])
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <div className="rounded-2xl border border-border bg-card px-8 py-6 text-center shadow-lg">
            <p className="text-lg font-medium">{t(greetingKey)}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
