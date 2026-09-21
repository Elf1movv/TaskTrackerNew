// Must stay in sync with server/src/auth.ts — frontend and backend are
// separate packages here, nothing shares these as actual types.
export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128

// Same check as the backend's hooks.before in server/src/auth.ts — a
// password of nothing but spaces or nothing but punctuation passes a
// length-only check but is a degenerate password either way.
export function hasLetterAndDigit(password: string): boolean {
  return /\p{L}/u.test(password) && /\d/.test(password)
}

export function meetsPasswordRequirements(password: string): boolean {
  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= MAX_PASSWORD_LENGTH &&
    hasLetterAndDigit(password)
  )
}
