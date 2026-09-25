import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { APIError, createAuthMiddleware } from "better-auth/api"
import { db } from "./db.js"
import { sendEmail } from "./lib/email.js"
import { resetPasswordEmailHtml, verificationEmailHtml } from "./lib/emailTemplates.js"

// Every request path where a new password is actually set — used by the
// hooks.before check below. Must stay in sync with shared/lib/auth/
// passwordRequirements.ts on the frontend (separate packages, no shared
// types), and with itself here: missing one of these would let someone
// set a letter/digit-free password through that specific flow.
const PASSWORD_SETTING_PATHS = new Set(["/sign-up/email", "/change-password", "/reset-password"])

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  // The browser is always at :5173 in dev (Vite's server.proxy forwards
  // /api to :3001, but the request's Origin header is still :5173) — that
  // differs from BETTER_AUTH_URL (:3001), so without this Better Auth
  // rejects every request with 403 "Missing or null Origin"/untrusted
  // origin. Not needed in prod: nginx serves frontend and API from the
  // same origin there, so BETTER_AUTH_URL already matches the real Origin.
  trustedOrigins: process.env.NODE_ENV === "production" ? undefined : ["http://localhost:5173"],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    // Explicit, not left as the library's implicit default — so the limit
    // is visible in source instead of only in better-auth's own code.
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Not awaited — Better Auth's own recommendation, so response timing
    // never reveals whether an email address exists in the system.
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Восстановление пароля — MyTracker",
        html: resetPasswordEmailHtml(url),
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Добро пожаловать в MyTracker — подтвердите почту",
        html: verificationEmailHtml(url),
      })
    },
    // Without this, someone who tries to log in before verifying just gets
    // "email not verified" with no way to get a fresh link if the first
    // one was lost or landed in spam.
    sendOnSignIn: true,
  },
  hooks: {
    // Better Auth only checks password length by default — a password of
    // nothing but spaces or nothing but punctuation (e.g. "!!!!!!!!")
    // passes that check but is a degenerate password either way. This
    // rejects it wherever a password is actually being set — must also be
    // enforced client-side (shared/lib/auth/passwordRequirements.ts) for
    // instant feedback, but has to live here too, or it's only a UI
    // suggestion: anyone calling the API directly could skip it entirely.
    before: createAuthMiddleware(async ctx => {
      if (!PASSWORD_SETTING_PATHS.has(ctx.path)) return
      const password = (ctx.body?.newPassword ?? ctx.body?.password) as string | undefined
      if (typeof password !== "string") return
      if (!/\p{L}/u.test(password) || !/\d/.test(password)) {
        throw new APIError("BAD_REQUEST", {
          code: "PASSWORD_NO_LETTER_OR_DIGIT",
          message: "Password must contain at least one letter and one digit",
        })
      }
    }),
  },
})
