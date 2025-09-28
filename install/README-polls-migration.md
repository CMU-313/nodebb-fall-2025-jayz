Polls migration verification
=============================

This file explains how to run the new polls migration and verify the schema. The project supports PostgreSQL; by default this workspace is configured to use Redis (see `config.json`).

Steps to run the migration and verification:

1. Configure Postgres in `config.json` (or set `postgres` config via environment/NCONF):

   - database: 'postgres'
   - postgres: { host, port, username, password, database }

2. Start Postgres and ensure NodeBB can connect.

3. Run the specific upgrade script (this will create `polls`, `poll_options`, `poll_responses` tables):

   node -e "require('./src/upgrade').runParticular(['add_polls_tables'])"

4. Run the verification SQL script against the database to insert test data and query counts:

   psql -h <host> -U <user> -d <database> -f install/sql/polls_verify.sql

Acceptance criteria:

- Tables `polls`, `poll_options`, and `poll_responses` exist.
- Polls can have multiple options.
- Multiple responses can be recorded for a poll.
- Polls have an optional FK to `users(uid)` (instructor link) when a `users` table exists.

If you want, I can also add a small automated test that runs these steps inside a CI/Postgres container.
