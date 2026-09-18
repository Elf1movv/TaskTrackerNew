import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { db } from "./db.js"
import { sendEmail } from "./lib/email.js"

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
    // Not awaited — Better Auth's own recommendation, so response timing
    // never reveals whether an email address exists in the system.
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Восстановление пароля — MyTracker",
        html: `<p>Чтобы задать новый пароль, перейдите по ссылке: <a href="${url}">${url}</a></p><p>Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.</p>`,
      })
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Подтвердите почту — MyTracker",
        html: `<p>Чтобы подтвердить почту и войти в MyTracker, перейдите по ссылке: <a href="${url}">${url}</a></p>`,
      })
    },
  },
})
