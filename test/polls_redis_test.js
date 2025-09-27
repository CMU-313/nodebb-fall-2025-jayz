'use strict';

const winston = require('winston');

// Use the project's test database mock so the global before hook sets up/flushes the test DB
const db = require('./mocks/databasemock');
const Polls = require('../src/polls/redis');
const assert = require('assert');

describe('Redis Polls (integration)', function () {
	this.timeout(30000);

	let createdPollId;

	it('creates a poll, adds options and records votes', async function () {
		// Create a poll
		const pollId = await Polls.createPoll('What is your favorite color?', 1, { multi: false });
		createdPollId = pollId;
		console.log('Created poll id:', pollId);

		// Add options
		const opt1 = await Polls.addOption(pollId, 'Red', 1);
		const opt2 = await Polls.addOption(pollId, 'Blue', 2);
		console.log('Added options:', opt1, opt2);

		// Simulate votes
		await Polls.vote(pollId, 'uid:100', opt1);
		await Polls.vote(pollId, 'uid:101', opt2);
		await Polls.vote(pollId, 'uid:102', opt1);

		// Read poll and results
		const poll = await Polls.getPoll(pollId);
		assert(poll && poll.poll, 'poll should be returned');
		assert.strictEqual(poll.poll.poll_id.toString(), String(pollId));

		const results = await Polls.getResults(pollId);
		assert(Array.isArray(results) && results.length >= 2, 'expected results for options');

		// Quick sanity on vote counts
		const opt2Result = results.find(r => String(r.option.option_id) === String(opt2));
		const opt1Result = results.find(r => String(r.option.option_id) === String(opt1));
		assert(opt1Result.votes >= 2, 'option 1 should have at least 2 votes');
		assert(opt2Result.votes >= 1, 'option 2 should have at least 1 vote');
	});

	after(async function () {
		// Clean up poll-related keys to avoid poll:* leakage between tests
		if (!createdPollId) {
			return;
		}
		const pattern = `poll:${createdPollId}*`;
		const keys = await db.scan({ match: pattern });
		if (keys && keys.length) {
			await db.deleteAll(keys);
		}
		// Also remove option object keys and global counters for this poll if any
		const optionNext = 'poll:option:next_id';
		if (await db.exists(optionNext)) {
			// no-op; keep counter but remove option objects that reference this poll
			const allOptionKeys = await db.scan({ match: 'poll:option:*' });
			const toDelete = [];
			// Only consider keys that are option object hashes of the form `poll:option:<id>`
			const optionObjKeys = allOptionKeys.filter(k => {
				const parts = k.split(':');
				return parts.length === 3 && parts[0] === 'poll' && parts[1] === 'option';
			});
			// Check types and only perform getObject on hashes to avoid WRONGTYPE
			const types = await Promise.all(optionObjKeys.map(k => db.type(k).catch(() => null)));
			const hashKeys = [];
			for (let i = 0; i < optionObjKeys.length; i++) {
				if (types[i] === 'hash') {
					hashKeys.push(optionObjKeys[i]);
				}
			}
			if (hashKeys.length) {
				const objs = await Promise.all(hashKeys.map(k => db.getObject(k).catch(err => {
					winston && winston.error ? winston.error('[polls_test teardown] getObject failed', err.stack) : console.error(err.stack);
					return null;
				})));
				for (let i = 0; i < hashKeys.length; i++) {
					const obj = objs[i];
					if (obj && String(obj.poll_id) === String(createdPollId)) {
						toDelete.push(hashKeys[i]);
					}
				}
			}
			if (toDelete.length) {
				await db.deleteAll(toDelete);
			}
		}
	});
});
