-- Sample verification SQL for polls migration
-- Run these after the NodeBB Postgres migration has been applied.

-- Insert a poll linked to an instructor (replace uid with an existing user id)
INSERT INTO "polls" (title, instructor_uid, settings)
VALUES ('Which topic should we cover next?', 1, '{"multiple": false}');

-- Insert options for the poll
INSERT INTO "poll_options" (poll_id, text, sort)
VALUES (currval(pg_get_serial_sequence('"polls"', 'poll_id')), 'Databases', 1),
       (currval(pg_get_serial_sequence('"polls"', 'poll_id')), 'Web Development', 2),
       (currval(pg_get_serial_sequence('"polls"', 'poll_id')), 'Security', 3);

-- View counts
SELECT p.poll_id, p.title, p.instructor_uid, count(r.response_id) AS responses
FROM "polls" p
LEFT JOIN "poll_responses" r ON r.poll_id = p.poll_id
GROUP BY p.poll_id;

-- Cast a response (replace uid with an existing user id)
INSERT INTO "poll_responses" (poll_id, option_id, uid)
SELECT p.poll_id, o.option_id, 2
FROM "polls" p
JOIN "poll_options" o ON o.poll_id = p.poll_id
WHERE p.title = 'Which topic should we cover next?'
LIMIT 1;

-- Check responses per option
SELECT o.option_id, o.text, count(r.response_id) AS votes
FROM "poll_options" o
LEFT JOIN "poll_responses" r ON r.option_id = o.option_id
WHERE o.poll_id = (SELECT poll_id FROM "polls" WHERE title = 'Which topic should we cover next?')
GROUP BY o.option_id, o.text
ORDER BY o.sort;
