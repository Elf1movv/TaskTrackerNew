import { Circle, CheckCircle2 } from "lucide-react"
import { MIN_PASSWORD_LENGTH, hasLetterAndDigit } from "@/shared/lib/auth"
import { useLanguage } from "@/shared/lib/i18n"
import { cn } from "./utils"

function Requirement({ met, label }: { met: boolean; label: string }) {
  const Icon = met ? CheckCircle2 : Circle
  return (
    <div className={cn("flex items-center gap-1.5 text-xs", met ? "text-primary" : "text-muted-foreground")}>
      <Icon size={13} />
      {label}
    </div>
  )
}

// Lives under a password field, updates on every keystroke — the two
// rules Better Auth (length) and our own hooks.before (letter + digit,
// see server/src/auth.ts) actually enforce, shown before submit instead
// of only after a failed request.
export function PasswordRequirementsHint({ password }: { password: string }) {
  const { t } = useLanguage()

  return (
    <div className="space-y-1 mt-1.5">
      <Requirement
        met={password.length >= MIN_PASSWORD_LENGTH}
        label={t("auth.password.requirementLength")}
      />
      <Requirement met={hasLetterAndDigit(password)} label={t("auth.password.requirementLetterDigit")} />
    </div>
  )
}
