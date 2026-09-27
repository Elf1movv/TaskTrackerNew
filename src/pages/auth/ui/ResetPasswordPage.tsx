import { useState } from "react"
import { KeyRound } from "lucide-react"
import { Link, useNavigate, useSearchParams } from "react-router"
import { authClient, translateAuthError } from "@/shared/lib/auth"
import { useLanguage } from "@/shared/lib/i18n"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import { Label } from "@/shared/ui/label"
import { AuthLayout } from "./AuthLayout"

// Same neutral status icon across both of this page's states (form vs.
// "invalid link") — only the heading text changes, per the mockup.
const RESET_ICON = (
  <div className="size-16 rounded-[18px] bg-primary-soft text-primary flex items-center justify-center">
    <KeyRound size={30} strokeWidth={1.75} />
  </div>
)

export function ResetPasswordPage() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit() {
    if (!newPassword || !token) return
    setError(null)
    setIsSubmitting(true)
    const { error: resetError } = await authClient.resetPassword({ newPassword, token })
    setIsSubmitting(false)
    if (resetError) {
      setError(translateAuthError(resetError, t, "auth.error.resetFailed"))
      return
    }
    navigate("/login")
  }

  if (!token) {
    return (
      <AuthLayout title={t("auth.resetPassword.invalidTitle")} icon={RESET_ICON}>
        <p className="text-sm text-destructive">{t("auth.resetPassword.invalidLink")}</p>
        <Button asChild className="w-full h-12 rounded-[10px] text-base font-bold shadow-card">
          <Link to="/forgot-password">{t("auth.resetPassword.requestNewLink")}</Link>
        </Button>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title={t("auth.resetPassword.title")} icon={RESET_ICON}>
      <div className="space-y-2">
        <Label htmlFor="reset-password">{t("auth.resetPassword.newPassword")}</Label>
        <Input
          id="reset-password"
          type="password"
          autoFocus
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSubmit()}
          className="h-12 rounded-[10px] bg-sunken"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        className="w-full h-12 rounded-[10px] text-base font-bold shadow-card"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {t("auth.resetPassword.submit")}
      </Button>
    </AuthLayout>
  )
}
