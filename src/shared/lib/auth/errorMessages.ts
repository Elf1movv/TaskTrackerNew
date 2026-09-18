import type { TranslationKey } from "@/shared/lib/i18n"

// Better Auth always returns a `.message`, but it's a hardcoded English
// string from the library — translating it ourselves means mapping its
// stable `.code` values to our own dictionary instead of showing the raw
// English text (or a fallback that would never actually be reached).
const ERROR_CODE_KEYS: Record<string, TranslationKey> = {
  INVALID_EMAIL_OR_PASSWORD: "auth.error.invalidCredentials",
  EMAIL_NOT_VERIFIED: "auth.error.emailNotVerified",
  USER_ALREADY_EXISTS: "auth.error.userAlreadyExists",
}

export function translateAuthError(
  error: { code?: string | null } | null | undefined,
  t: (key: TranslationKey) => string,
  fallback: TranslationKey = "auth.error.generic",
): string {
  const key = error?.code ? ERROR_CODE_KEYS[error.code] : undefined
  return t(key ?? fallback)
}
