# Browser verification

Run against `http://localhost:3002` (isolated `redesign_browser` schema in
`tasktracker_test`) or `https://test.mytracker.space` only. Production is rejected.
Requires Node and an isolated Chrome with remote debugging on `127.0.0.1:9222`.
The app must be built and running before registration. No mail is sent when
`EMAIL_DELIVERY=disabled`.

1. `node scripts/qa/independent-browser.mjs register` writes a disposable login
   to `/private/tmp/mytracker-independent-login.json` (mode 600), prints email only.
2. Verify that exact QA email in the isolated database:
   `node --env-file=/private/tmp/mytracker-redesign-browser.env scripts/qa-browser-user.mjs verify <email>`
   from `server/`; on staging run `scripts/qa-browser-user.mjs` inside the staging app.
3. `node scripts/qa/independent-browser.mjs suite` — 18 UI/API checks. This resets
   only records belonging to the matching disposable QA session. Never provide
   owner credentials; both the email pattern and session identity are checked.
4. `node scripts/qa/calendar-gestures.mjs` — six additional mouse/touch checks,
   in the same QA browser session after the suite.
5. Cleanup using `scripts/qa-browser-user.mjs cleanup <email>` on that isolated DB,
   delete the local credentials file, then close the QA Chrome.

For staging set `QA_ORIGIN=https://test.mytracker.space` and a separate
`QA_CREDENTIALS=/private/tmp/mytracker-staging-qa-login.json` for both commands.
Screenshots and JSON results go to `/private/tmp/mytracker-qa-*` and
`/private/tmp/mytracker-*-results.json`, never into Git.

Coverage includes description collapse, completion/reopen, note reorder and
persistence, mouse/touch/repeated gestures, long text, archive/restore,
confirmed/cancelled deletion across tabs, independent goals/tasks/plans,
selected date, On hold, exact 20-minute moves, resize, mobile width, JS errors.
API/DB unit tests run separately against `tasktracker_test.public`; never run
those cleanup-based tests against the shared staging database.
