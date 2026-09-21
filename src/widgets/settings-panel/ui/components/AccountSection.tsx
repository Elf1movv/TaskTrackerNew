import { useState } from "react"
import { toast } from "sonner"
import {
  changePassword,
  MAX_PASSWORD_LENGTH,
  meetsPasswordRequirements,
  translateAuthError,
} from "@/shared/lib/auth"
import { useLanguage } from "@/shared/lib/i18n"
import { monoFont } from "@/shared/lib/typography"
import { Button } from "@/shared/ui/button"
import { Checkbox } from "@/shared/ui/checkbox"
import { Label } from "@/shared/ui/label"
import { PasswordInput } from "@/shared/ui/password-input"
import { PasswordRequirementsHint } from "@/shared/ui/password-requirements-hint"

export function AccountSection({ email }: { email: string }) {
  const { t } = useLanguage()
  const [isChanging, setIsChanging] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  function resetForm() {
    setIsChanging(false)
    setCurrentPassword("")
    setNewPassword("")
    setRevokeOtherSessions(false)
  }

  async function handleSubmit() {
    if (!currentPassword || !meetsPasswordRequirements(newPassword)) return
    setIsSubmitting(true)
    const { error } = await changePassword({ currentPassword, newPassword, revokeOtherSessions })
    setIsSubmitting(false)
    if (error) {
      toast.error(translateAuthError(error, t, "auth.error.generic"))
      return
    }
    toast.success(t("settings.account.success"))
    resetForm()
  }

  return (
    <div className="space-y-4">
      <div css={monoFont} className="text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
        {t("settings.account.title")}
      </div>

      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">{t("settings.account.email")}</div>
        <div className="text-sm">{email}</div>
      </div>

      {isChanging ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="settings-current-password">{t("settings.account.currentPassword")}</Label>
            <PasswordInput
              id="settings-current-password"
              autoFocus
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-new-password">{t("settings.account.newPassword")}</Label>
            <PasswordInput
              id="settings-new-password"
              maxLength={MAX_PASSWORD_LENGTH}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <PasswordRequirementsHint password={newPassword} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={revokeOtherSessions}
              onCheckedChange={checked => setRevokeOtherSessions(checked === true)}
            />
            {t("settings.account.revokeOtherSessions")}
          </label>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={handleSubmit}
              disabled={isSubmitting || !currentPassword || !meetsPasswordRequirements(newPassword)}
            >
              {t("common.save")}
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={resetForm}>
              {t("common.cancel")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">{t("settings.account.password")}</div>
          <div className="flex items-center justify-between">
            <span className="text-sm tracking-widest">••••••••</span>
            <Button size="sm" variant="ghost" onClick={() => setIsChanging(true)}>
              {t("settings.account.changePassword")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
