import { useState } from "react"
import { Link } from "react-router"
import { authClient } from "@/shared/lib/auth"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { AuthLayout } from "./AuthLayout"

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
      <AuthLayout title={t("auth.forgotPassword.checkEmailTitle")}>
        <p className="text-sm text-muted-foreground">
          {t("auth.forgotPassword.checkEmailBody", { email: email.trim() })}
        </p>
        <Button asChild className="w-full">
          <Link to="/login">{t("auth.register.backToLogin")}</Link>
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t("auth.forgotPassword.title")}>
      <div className="space-y-2">
        <Label htmlFor="forgot-email">{t("auth.email")}</Label>
        <Input
          id="forgot-email"
          type="email"
          autoFocus
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
        />
      </div>
      <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
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
