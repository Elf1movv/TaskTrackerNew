import type { NextFunction, Request, Response } from "express"
import { fromNodeHeaders } from "better-auth/node"
import { auth } from "../auth.js"

// Reads the Better Auth session cookie, attaches the current user's id to
// the request, or rejects with 401. Mounted per-router (tasks/goals/
// habits/categories), not globally — /api/auth/* itself must stay
// reachable without a session (you can't log in if logging in requires
// already being logged in).
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) })
  if (!session) {
    res.status(401).json({ error: "Unauthorized" })
    return
  }
  req.userId = session.user.id
  next()
}
