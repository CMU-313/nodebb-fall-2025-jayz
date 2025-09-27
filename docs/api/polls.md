# Polls API

This document describes the Polls REST API endpoints implemented in the server. These endpoints allow the frontend to create polls, add options, submit votes, and fetch results.

Base path: `/api/polls`

Authentication & CSRF
- Most write endpoints require an authenticated user session (cookie-based) and a CSRF token.
- Use the same login flow as the rest of the app to obtain a session cookie and CSRF token. The tests use helper `helpers.loginUser` which performs login and returns a cookie jar and CSRF token.

Endpoints

1) Create a poll

- Method: POST
- URL: /api/polls
- Auth: required (session + CSRF)
- Body (JSON):
  - title: string (required)
  - instructor_uid: integer (optional)
  - settings: object (optional)
- Response (200): { poll_id: "<id>" }
- Error responses: 400 (missing/invalid title), 500 (server error)

Example (curl):

    curl -X POST "$BASE_URL/api/polls" \
      -H "Content-Type: application/json" \
      -H "Cookie: <session cookie>" \
      -H "X-CSRF-Token: <token>" \
      -d '{"title":"My Poll"}'

2) Add an option to a poll

- Method: POST
- URL: /api/polls/:id/options
- Auth: required (session + CSRF)
- URL params:
  - id: poll id (integer)
- Body (JSON):
  - text: string (required)
  - sort: integer (optional)
- Response (200): { option_id: "<optionId>" }
- Error responses: 400 (invalid poll id / missing text / invalid option), 404 (no poll), 500 (server)

Example (fetch):

    await fetch(`${BASE_URL}/api/polls/${pollId}/options`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
      },
      body: JSON.stringify({ text: 'Option A' }),
    });

3) Submit a vote

- Method: POST
- URL: /api/polls/:id/vote
- Auth: required (session + CSRF)
- Body (JSON):
  - option_id: string|int (required)
- Response (200): { success: true }
- Error responses: 400 (invalid poll id / missing option id / option doesn't belong to poll), 404 (no poll), 500

Notes:
- The server validates that the option belongs to the poll before counting the vote.
- Votes are recorded against the user's uid if logged in; otherwise as anonymous responses.

4) Get poll (with options and counts)

- Method: GET
- URL: /api/polls/:id
- Auth: public
- Response (200):
  - { poll: { id, title, options: [{ id, text, votes }], votes: { <optionId>: <count> }, created } }
- Error responses: 400 (invalid id), 404 (no poll)

5) Get poll results (summary)

- Method: GET
- URL: /api/polls/:id/results
- Auth: public
- Response (200): { pollId: "<id>", results: { options: [{ id, text, votes }], totalVotes } }

Example (node + node-fetch):

    const res = await fetch(`${BASE_URL}/api/polls/${pollId}/results`);
    const data = await res.json();

Notes and versions
- Responses may be wrapped by the project's API envelope: { status: {...}, response: <payload> } — tests and clients should unwrap if necessary. The current controllers return the payload via the project's helper which uses that envelope.
- If you need the raw payload, check for `body.response` and fallback to `body`.

Troubleshooting
- If you get 403 or CSRF errors, ensure you include the `X-CSRF-Token` header and have an active session cookie.
- If tests fail due to OpenAPI schema validation, ensure the returned object shape matches the documented response (options array with votes, ids as strings).

Contact
- For frontend integration questions, open an issue or ping the backend author in the repo.
