export {
  authClient,
  useSession,
  signIn,
  signUp,
  signOut,
  requestPasswordReset,
  resetPassword,
  changePassword,
} from "./authClient"
export { translateAuthError } from "./errorMessages"
export {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  hasLetterAndDigit,
  meetsPasswordRequirements,
} from "./passwordRequirements"
