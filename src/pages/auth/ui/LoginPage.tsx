import { useState } from "react"
import { Link, useSearchParams } from "react-router"
import { authClient, translateAuthError } from "@/shared/lib/auth"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { AuthLayout } from "./AuthLayout"

export function LoginPage() {
  const { t } = useLanguage()
  const [searchParams] = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    if (!email.trim() || !password) return
    setError(null)
    setIsSubmitting(true)
    const { error: signInError } = await authClient.signIn.email({ email: email.trim(), password })
    setIsSubmitting(false)
    if (signInError) {
      setError(translateAuthError(signInError, t, "auth.error.invalidCredentials"))
      return
    }
    // A full navigation, not react-router's navigate() — RootLayout needs a
    // fresh mount so its useSession() subscription starts from the
    // just-set cookie instead of racing a stale cached "no session" value
    // from before login. The query flag tells TodayPage which greeting to
    // show — "verified=1" only ever arrives via the email-verification
    // redirect (see RegisterPage), so it reliably marks the very first login.
    const isFirstLogin = searchParams.get("verified") === "1"
    window.location.href = isFirstLogin ? "/today?firstLogin=1" : "/today?welcomeBack=1"
  }

  return (
    <AuthLayout title={t("auth.login.title")}>
      <div className="space-y-2">
        <Label htmlFor="login-email">{t("auth.email")}</Label>
        <Input
          id="login-email"
          type="email"
          autoFocus
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password">{t("auth.password")}</Label>
          <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
            {t("auth.login.forgotPassword")}
          </Link>
        </div>
        <Input
          id="login-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting}>
        {t("auth.login.submit")}
      </Button>
      <p className="text-sm text-muted-foreground text-center">
        {t("auth.login.noAccount")}{" "}
        <Link to="/register" className="text-primary hover:underline">
          {t("auth.login.registerLink")}
        </Link>
      </p>
    </AuthLayout>
  )
}
