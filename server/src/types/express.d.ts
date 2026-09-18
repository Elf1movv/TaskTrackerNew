// Augments Express's Request type so `req.userId` is recognized by
// TypeScript everywhere a route handler runs after `requireAuth`.
declare namespace Express {
  export interface Request {
    userId: string
  }
}
