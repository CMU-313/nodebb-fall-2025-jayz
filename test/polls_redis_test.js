'use strict';

// Use the project's test database mock so the global before hook sets up/flushes the test DB
const db = require('./mocks/databasemock');
const Polls = require('../src/polls/redis');
const assert = require('assert');

describe('Redis Polls (integration)', function () {
	this.timeout(30000);

	it('creates a poll, adds options and records votes', async function () {
		// Create a poll
		const pollId = await Polls.createPoll('What is your favorite color?', 1, { multi: false });
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
});
