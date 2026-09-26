import type { ErrorRequestHandler } from "express"

// Express 5 forwards a rejected promise from an async route handler to this
// automatically (Router awaits the handler and calls next(err) on rejection)
// — no extra wrapper around route handlers is needed for that to work.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err)
  // body-parser's own "entity.too.large" error (a request over one of
  // app.ts's per-route JSON size limits) already carries the correct 413
  // on itself — without this, an oversized body looked identical to a
  // genuine server bug (500) instead of the client's own mistake.
  const status = typeof err?.status === "number" ? err.status : 500
  res.status(status).json({ error: status === 500 ? "Internal server error" : err.message })
}
