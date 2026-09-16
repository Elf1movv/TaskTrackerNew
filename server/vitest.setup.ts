import { config } from "dotenv"

config({ path: ".env.test" })

// Hard stop: refuse to run a single test if DATABASE_URL doesn't look like a
// dedicated test database. This file is the ONLY place test DB config is
// loaded from — server/.env (used by `npm run dev` / production) is never
// read here, so tests can never accidentally run against real data.
if (!process.env.DATABASE_URL || !process.env.DATABASE_URL.includes("test")) {
  throw new Error(
    "Refusing to run tests: DATABASE_URL is missing or does not look like a " +
      "test database (expected the name to contain 'test'). Check server/.env.test — " +
      "see server/.env.test.example.",
  )
}
