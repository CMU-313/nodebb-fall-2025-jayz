# User Guide — New Features: User Nicknames & Polls

This document explains how to use and test the two features added to the repo:
- User nicknames — set/display a nickname for users.
- Polls — create polls, add options, submit responses, and get results via REST API.

---

## Quick start

Prereqs
- Node.js, npm, Redis running.
- From repo root:

Start app (dev):
- npm start

Install deps & run tests:
- npm ci
- npm test

Run only polls integration test:
- npx mocha test/polls_api.js

Run only Redis-layer polls tests:
- npx mocha test/polls_redis_test.js

---

## User Nicknames

What it does
- Users can set a display nickname persisted to the user record and shown where configured.

How to use (UI)
- Visit Account → Profile/Settings → Nickname and save.

How to use (API)
- Use existing user-profile update endpoints (authenticated + CSRF) to set `nickname`.

How to test
- Manual:
  1. Log in.
  2. Set nickname in profile.
  3. Verify display on pages showing usernames.
- Automated:
  - Relevant tests live in the user test suites under `test/` (search for `nickname`).

---

## Polls

Overview
- Polls are Redis-backed and exposed via REST endpoints so frontend can create polls, add options, vote, and fetch results.

Full API docs
- `docs/api/polls.md` (includes examples: curl, fetch, Node.js)

Key endpoints (summary)
- POST /api/polls — create poll (auth + CSRF)
- GET /api/polls/:id — get poll + options (public)
- POST /api/polls/:id/options — add option (auth + CSRF)
- POST /api/polls/:id/vote — submit vote (auth + CSRF)
- GET /api/polls/:id/results — get results (public)

CSRF & auth notes
- POSTs require a logged-in session cookie and header `x-csrf-token`.
- Get token: GET /api/config → `csrf_token`.
- Browser fetch: use `credentials: 'same-origin'` or `include` for cross-origin.

Data model (Redis)
- poll:next_id — global counter
- poll:<pollId> — poll hash
- poll:<pollId>:options — list of option ids
- poll:option:next_id — global option id counter
- poll:option:<optionId> — option hash
- poll:<pollId>:responses — hash uid → optionId
- poll:<pollId>:option:<optionId>:votes — per-option counter

Important behavior
- Voting is atomic (previous vote decremented, new incremented using MULTI/EXEC).
- Controller validates option belongs to poll before counting vote.

---

## Automated tests — locations & coverage

Polls tests
- test/polls_api.js
  - Integration test: create poll → add options → vote → get results.
  - Covers: REST endpoints, auth+CSRF flows, end-to-end vote tally correctness.

- test/polls_redis_test.js
  - Redis-level tests for Polls module: id counters, object storage, lists, responses, counters.

User nicknames tests
- Included among user tests in `test/` (search for `nickname`).
  - Covers: setting, persistence, basic display.

Why tests are sufficient
- Integration test exercises the full API flow a frontend requires.
- Redis tests validate underlying storage and concurrency-critical counters.
- Nickname tests verify persistence and basic UI/API behavior.

---

## Run tests locally (commands)

Install deps and run full suite:
```bash
npm ci
npm test
```

Run a single test file:
```bash
npx mocha test/polls_api.js
npx mocha test/polls_redis_test.js
```

If tests need Redis, ensure Redis is running and `config.json` test settings point to it.

---

## Troubleshooting (common CI/dev issues)

- sendmail-not-found: CI containers often lack sendmail. Tests register a no-op email hook; if you see sendmail errors, ensure the test bootstrap registers the hook or set NODE_ENV=test to skip fallback.
- unsupported image format: image tooling (libvips/ImageMagick) may be missing. Install runtime libs or stub image-processing in tests.
- CSRF errors: ensure you fetch `/api/config` and include `x-csrf-token` header for POSTs; include session cookies (`credentials` in fetch).

---

## Where to look in the repo

- Polls implementation: `src/polls/redis.js`
- Polls controller/routes: `src/controllers/polls.js`, `src/routes/api.js`
- API docs: `docs/api/polls.md`
- Tests: `test/polls_api.js`, `test/polls_redis_test.js`, user tests under `test/`

---
