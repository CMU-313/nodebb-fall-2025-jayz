# Polls API

This document describes the Polls REST API endpoints and includes copy-paste examples the frontend team can use.

Base paths
- Server base URL: `nconf.get('url')` (typically `http://localhost:4567` in development)
- All endpoints are mounted under `/api`

Authentication & CSRF
- POST endpoints require a logged-in session (cookie-based session) and a CSRF token header.
- Fetch the CSRF token from `GET /api/config` → `csrf_token`.
- In browser requests include credentials: `fetch(url, { credentials: 'same-origin' })`.
- Add header: `x-csrf-token: <csrf_token>` for POST requests.

Endpoints

## Create a poll
- Method: POST
- URL: `/api/polls`
- Auth: required (session cookie) + CSRF
- Body (JSON):
  - `title` (string) — required
  - `instructor_uid` (number) — optional
  - `settings` (object) — optional
- Success: `200 OK` - `{ "poll_id": "<id>" }`
- Errors:
  - `400` `{ error: 'missing_title' }`
  - `401` / `403` when not authorized or CSRF invalid

Browser fetch example

```js
// assume csrf is obtained from GET /api/config and cookie session exists
const res = await fetch('/api/polls', {
  method: 'POST',
  credentials: 'same-origin',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrf,
  },
  body: JSON.stringify({ title: 'My poll title', settings: { multi: false } }),
});
const data = await res.json();
console.log('created poll id', data.poll_id);
```

Curl example

```bash
BASE="http://localhost:4567"
JAR=cookies.txt
CSRF=$(curl -s -c $JAR "$BASE/api/config" | jq -r '.csrf_token')
# login step (set cookie)
curl -b $JAR -c $JAR -X POST "$BASE/login" -H "Content-Type: application/json" -H "x-csrf-token: $CSRF" -d '{"username":"admin","password":"123456"}'

CSRF=$(curl -s -b $JAR "$BASE/api/config" | jq -r '.csrf_token')
curl -b $JAR -c $JAR -X POST "$BASE/api/polls" \
  -H "Content-Type: application/json" -H "x-csrf-token: $CSRF" \
  -d '{"title":"My CLI Poll"}' | jq
```

## Get a poll
- Method: GET
- URL: `/api/polls/:id`
- Auth: none (public)
- Success: `200 OK` - returns poll object and `options` array
- Errors: `400 invalid_poll_id`, `404 not_found`

Browser fetch example

```js
const res = await fetch(`/api/polls/${pollId}`, { credentials: 'same-origin' });
const { poll, options } = await res.json();
```

## Add an option
- Method: POST
- URL: `/api/polls/:id/options`
- Auth: required + CSRF
- Body (JSON):
  - `text` (string) — required
  - `sort` (number) — optional
- Success: `200 OK` - `{ "option_id": "<id>" }`
- Errors: `400 invalid_poll_id`, `400 missing_option_text`, `404 not_found`

Browser fetch example

```js
const csrf = /* get from /api/config */;
const res = await fetch(`/api/polls/${pollId}/options`, {
  method: 'POST',
  credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
  body: JSON.stringify({ text: 'New option' }),
});
const { option_id } = await res.json();
```

## Vote
- Method: POST
- URL: `/api/polls/:id/vote`
- Auth: required + CSRF
- Body (JSON):
  - `option_id` — required (must belong to this poll)
- Success: `200 OK` - `{ "success": true }`
- Errors:
  - `400 invalid_poll_id`, `400 missing_option_id`, `400 invalid_option_for_poll`, `404 not_found`, `401 not-authorised`

Browser fetch example

```js
const res = await fetch(`/api/polls/${pollId}/vote`, {
  method: 'POST',
  credentials: 'same-origin',
  headers: { 'Content-Type': 'application/json', 'x-csrf-token': csrf },
  body: JSON.stringify({ option_id: selectedOptionId }),
});
const data = await res.json();
if (data.success) { /* refresh results */ }
```

## Results
- Method: GET
- URL: `/api/polls/:id/results`
- Auth: none (public)
- Success: `200 OK` - `{ "results": [ { option_id, text, votes }, ... ] }`

Browser fetch example

```js
const res = await fetch(`/api/polls/${pollId}/results`, { credentials: 'same-origin' });
const { results } = await res.json();
```

## Frontend tips
- Before doing POSTs: ensure user is logged in (session cookie) and request `/api/config` to get the CSRF token.
- Use `fetch(..., { credentials: 'same-origin' })` to include cookies.
- Handle 4xx JSON errors (controller returns `{ error: '...' }` for many cases).

---

If you want, I can also add a small `scripts/cli-polls.sh` or `scripts/cli-polls.js` file to the repo that runs the create/add/vote/results sequence for developers to run locally.
