import type { ErrorRequestHandler } from "express"

// Express 5 forwards a rejected promise from an async route handler to this
// automatically (Router awaits the handler and calls next(err) on rejection)
// — no extra wrapper around route handlers is needed for that to work.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: "Internal server error" })
}
