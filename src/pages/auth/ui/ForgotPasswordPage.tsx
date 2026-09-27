import { useState } from "react"
import { Lock } from "lucide-react"
import { Link } from "react-router"
import { authClient } from "@/shared/lib/auth"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { AuthLayout } from "./AuthLayout"

// Same neutral status icon across both of this page's states (form vs.
// "check your email") — only the heading text changes, per the mockup.
const FORGOT_ICON = (
  <div className="size-16 rounded-[18px] bg-primary-soft text-primary flex items-center justify-center">
    <Lock size={30} strokeWidth={1.75} />
  </div>
)

export function ForgotPasswordPage() {
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit() {
    if (!email.trim()) return
    setIsSubmitting(true)
    await authClient.requestPasswordReset({
      email: email.trim(),
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setIsSubmitting(false)
    // Always show the same confirmation regardless of whether the email
    // exists — matches Better Auth's own no-await-send pattern, so a
    // response never reveals which emails are registered.
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <AuthLayout title={t("auth.forgotPassword.checkEmailTitle")} icon={FORGOT_ICON}>
        <p className="text-sm text-muted-foreground">
          {t("auth.forgotPassword.checkEmailBody", { email: email.trim() })}
        </p>
        <Button asChild className="w-full h-12 rounded-[10px] text-base font-bold shadow-card">
          <Link to="/login">{t("auth.register.backToLogin")}</Link>
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t("auth.forgotPassword.title")} icon={FORGOT_ICON}>
      <div className="space-y-2">
        <Label htmlFor="forgot-email">{t("auth.email")}</Label>
        <Input
          id="forgot-email"
          type="email"
          autoFocus
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          className="h-12 rounded-[10px] bg-sunken"
        />
      </div>
      <Button
        className="w-full h-12 rounded-[10px] text-base font-bold shadow-card"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {t("auth.forgotPassword.submit")}
      </Button>
      <p className="text-sm text-muted-foreground text-center">
        <Link to="/login" className="text-primary hover:underline">
          {t("auth.forgotPassword.backToLogin")}
        </Link>
      </p>
    </AuthLayout>
  )
}
