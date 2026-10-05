import { useState } from "react"
import { Link } from "react-router"
import {
  authClient,
  MAX_PASSWORD_LENGTH,
  meetsPasswordRequirements,
  translateAuthError,
} from "@/shared/lib/auth"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { PasswordRequirementsHint } from "@/shared/ui/password-requirements-hint"
import { AuthLayout } from "./AuthLayout"

export function RegisterPage() {
  const { t } = useLanguage()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !meetsPasswordRequirements(password)) return
    setError(null)
    setIsSubmitting(true)
    const { error: signUpError } = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
      // Better Auth embeds this in the verification email link and
      // redirects the browser here once the link is clicked — the only
      // reliable signal LoginPage has to tell "first ever login" apart
      // from a normal returning login.
      callbackURL: `${window.location.origin}/login?verified=1`,
    })
    setIsSubmitting(false)
    if (signUpError) {
      setError(translateAuthError(signUpError, t, "auth.error.registerFailed"))
      return
    }
    setSubmittedEmail(email.trim())
  }

  if (submittedEmail) {
    const isStaging = import.meta.env.VITE_APP_ENV === "staging"
    return (
      <AuthLayout title={t(isStaging ? "auth.register.stagingTitle" : "auth.register.checkEmailTitle")}>
        <p className="text-sm text-muted-foreground">
          {t(isStaging ? "auth.register.stagingBody" : "auth.register.checkEmailBody", {
            email: submittedEmail,
          })}
        </p>
        <Button asChild className="w-full h-12 rounded-[10px] text-base font-bold shadow-card">
          <Link to="/login">{t("auth.register.backToLogin")}</Link>
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t("auth.register.title")}>
      <div className="space-y-2">
        <Label htmlFor="register-name">{t("auth.name")}</Label>
        <Input
          id="register-name"
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          className="h-12 rounded-[10px] bg-sunken"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-email">{t("auth.email")}</Label>
        <Input
          id="register-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          className="h-12 rounded-[10px] bg-sunken"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-password">{t("auth.password")}</Label>
        <Input
          id="register-password"
          type="password"
          maxLength={MAX_PASSWORD_LENGTH}
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          className="h-12 rounded-[10px] bg-sunken"
        />
        <PasswordRequirementsHint password={password} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        className="w-full h-12 rounded-[10px] text-base font-bold shadow-card mt-1"
        onClick={handleSubmit}
        disabled={isSubmitting || !meetsPasswordRequirements(password)}
      >
        {t("auth.register.submit")}
      </Button>
      <p className="text-sm text-muted-foreground text-center">
        {t("auth.register.haveAccount")}{" "}
        <Link to="/login" className="text-primary hover:underline">
          {t("auth.register.loginLink")}
        </Link>
      </p>
    </AuthLayout>
  )
}
