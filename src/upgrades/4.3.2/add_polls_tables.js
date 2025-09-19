'use strict';

const nconf = require('nconf');
const db = require('../../database');

module.exports = {
	name: 'Add polls, poll_options and poll_responses tables',
	timestamp: Date.UTC(2025, 8, 19),
	method: async () => {
		// Only run for Postgres installations (skip if using Redis primary)
		if (nconf.get('database') !== 'postgres' || nconf.get('redis')) {
			return;
		}

		const client = db.pool;

		// Detect whether a relational users table exists so we can add an FK to instructors
		const usersExistsRes = await client.query(
			"SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') AS exists"
		);
		const usersExists = usersExistsRes.rows && usersExistsRes.rows[0] && usersExistsRes.rows[0].exists;

		await client.query('BEGIN');
		try {
			await client.query(`
CREATE TABLE IF NOT EXISTS "polls" (
    "poll_id" SERIAL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "instructor_uid" INTEGER,
    "settings" JSONB DEFAULT '{}'::JSONB,
    "created_at" TIMESTAMPTZ DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ DEFAULT NOW()
)
`);

			// Add FK to users(uid) only when that table exists in the DB
			if (usersExists) {
				// guard: add constraint only if not present
				await client.query(`DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints tc
            JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY'
              AND tc.table_name = 'polls'
              AND kcu.column_name = 'instructor_uid'
        ) THEN
            ALTER TABLE "polls"
                ADD CONSTRAINT "fk_polls_instructor"
                    FOREIGN KEY ("instructor_uid") REFERENCES "users"("uid")
                    ON DELETE SET NULL ON UPDATE CASCADE;
        END IF;
    END$$;`);
			}

			await client.query(`
CREATE TABLE IF NOT EXISTS "poll_options" (
    "option_id" SERIAL PRIMARY KEY,
    "poll_id" INTEGER NOT NULL REFERENCES "polls"("poll_id") ON DELETE CASCADE,
    "text" TEXT NOT NULL,
    "sort" INTEGER DEFAULT 0
)
`);

			await client.query(`
CREATE TABLE IF NOT EXISTS "poll_responses" (
    "response_id" SERIAL PRIMARY KEY,
    "poll_id" INTEGER NOT NULL REFERENCES "polls"("poll_id") ON DELETE CASCADE,
    "option_id" INTEGER REFERENCES "poll_options"("option_id") ON DELETE SET NULL,
    "uid" INTEGER,
    "meta" JSONB DEFAULT '{}'::JSONB,
    "created_at" TIMESTAMPTZ DEFAULT NOW()
)
`);

			await client.query(`
CREATE INDEX IF NOT EXISTS "idx_polls_instructor_uid" ON "polls"("instructor_uid");
CREATE INDEX IF NOT EXISTS "idx_poll_options_poll_id" ON "poll_options"("poll_id");
CREATE INDEX IF NOT EXISTS "idx_poll_responses_poll_id" ON "poll_responses"("poll_id");
CREATE INDEX IF NOT EXISTS "idx_poll_responses_uid" ON "poll_responses"("uid");
`);

			await client.query('COMMIT');
		} catch (err) {
			await client.query('ROLLBACK');
			throw err;
		}
	},
};
