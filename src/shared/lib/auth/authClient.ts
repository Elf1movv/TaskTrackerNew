import { createAuthClient } from "better-auth/react"

// No baseURL needed — the backend serves /api/auth/* on the same origin as
// the frontend in both dev (Vite's server.proxy forwards /api to :3001,
// see vite.config.ts) and prod (nginx serves both from mytracker.space).
export const authClient = createAuthClient()

export const { useSession, signIn, signUp, signOut, requestPasswordReset, resetPassword } = authClient
