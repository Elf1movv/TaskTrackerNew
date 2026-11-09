import type { ReactNode } from "react"
import { motion } from "motion/react"
import { Check } from "lucide-react"
import { useLanguage } from "@/shared/lib/i18n"
import { cn } from "@/shared/ui/utils"
import type { CreatedItems } from "../model/onboardingMachine"
import { CREATE_STEP_COUNT } from "../model/steps"

// Small building blocks shared by the onboarding screens (ui/steps/*).

export function StepTop({ counts, label, onSkip }: { counts?: number; label?: string; onSkip: () => void }) {
  const { t } = useLanguage()
  return (
    <div className="flex items-center justify-between gap-3">
      {counts ? (
        <div
          className="flex items-center gap-1.5"
          role="img"
          aria-label={t("onboarding.stepOf", { step: counts, total: CREATE_STEP_COUNT })}
        >
          {Array.from({ length: CREATE_STEP_COUNT }, (_, i) => {
            const n = i + 1
            return (
              <motion.span
                key={n}
                layout
                className={cn(
                  "h-1.5 rounded-full",
                  n === counts
                    ? "w-6 bg-primary"
                    : n < counts
                      ? "w-1.5 bg-primary/45"
                      : "w-1.5 bg-border-strong",
                )}
              />
            )
          })}
        </div>
      ) : (
        <span className="text-meta font-semibold text-muted-foreground">{label}</span>
      )}
      <button
        type="button"
        onClick={onSkip}
        className="rounded-sm text-meta font-semibold text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary"
      >
        {t("onboarding.skipAll")}
      </button>
    </div>
  )
}

export function StepIcon({ children }: { children: ReactNode }) {
  return (
    <span className="flex size-11 items-center justify-center rounded-lg bg-primary-soft text-primary">
      {children}
    </span>
  )
}

export function StepTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-title font-extrabold tracking-tight text-balance">{children}</h2>
}

export function StepText({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-meta font-bold text-muted-foreground">{children}</span>
}

// Pill-shaped single-choice option ("Today / Tomorrow / No deadline").
export function Choice({
  selected,
  onClick,
  children,
  dashed,
}: {
  selected?: boolean
  onClick: () => void
  children: ReactNode
  dashed?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-meta font-semibold transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        selected
          ? "border-primary bg-primary-soft text-primary"
          : "border-border bg-card hover:border-border-strong",
        dashed && "border-dashed text-primary",
      )}
    >
      {children}
    </button>
  )
}

export function FeatureRow({
  icon,
  title,
  children,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex w-5 shrink-0 justify-center pt-0.5">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold">{title}</div>
        <div className="text-meta text-muted-foreground">{children}</div>
      </div>
    </div>
  )
}

// The three cells that fill up as the habit, task and goal get created.
export function CreatedTray({ created }: { created: CreatedItems }) {
  const { t } = useLanguage()
  const cells = [
    { label: t("onboarding.tray.habit"), value: created.habitTitle },
    { label: t("onboarding.tray.task"), value: created.taskTitle },
    { label: t("onboarding.tray.goal"), value: created.goalTitle },
  ]
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {cells.map(cell => (
        <div
          key={cell.label}
          className={cn(
            "flex min-h-8 min-w-0 items-center gap-1.5 rounded-md border-[1.5px] px-2 py-1 text-caption",
            cell.value
              ? "border-success bg-success-bg text-foreground"
              : "border-dashed border-border text-muted-foreground",
          )}
        >
          {cell.value && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="shrink-0 text-success"
            >
              <Check size={12} strokeWidth={3} />
            </motion.span>
          )}
          <span className="truncate">{cell.value ?? cell.label}</span>
        </div>
      ))}
    </div>
  )
}
