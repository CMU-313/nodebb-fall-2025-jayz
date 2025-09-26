'use strict';

// Use the project's test database mock so the global before hook sets up/flushes the test DB
const db = require('./mocks/databasemock');
const Polls = require('../src/polls/redis');
const User = require('../src/user');
const Groups = require('../src/groups');
const assert = require('assert');

describe('Redis Polls (integration)', function () {
	this.timeout(30000);

	it('creates a poll, adds options and records votes', async function () {
		// Create admin userID 
		const adminUID1 = await User.create({
			username: 'admin',
			password: 'password123',
			email: 'admin@test.com',
		});
		await Groups.join('administrators', adminUID1);
		console.log('Created admin with UID:', adminUID1);

		// Create Regular userID 
		const user1 = await User.create({
			username: 'John Doe',
			password: 'password123',
			email: 'John@test.com',
		});
		console.log('Created user with UID:', user1);

		// // Create Regular userID 
		const user2 = await User.create({
			username: 'Jane',
			password: 'password123',
			email: 'Jane@test.com',
		});
		console.log('Created user with UID:', user2);

		// Attempt Poll Creation with ADMIN
		const pollId = await Polls.createPoll('What is your favorite color?', adminUID1, { multi: false });
		console.log('SUCCESS: Created poll id:', pollId);

		// Attempt Poll Creation with USER
		try {
			await Polls.createPoll('What is your least favorite food?', user1, { multi: false });
			throw new Error('Expected error was not thrown');
		} catch (err) {
			if (err.message.includes('no-privileges')) {
				console.log('SUCCESS: No permissions error thrown');
			}
			else {
				throw(err);
			}
		}


		// Add options with admin
		const opt1 = await Polls.addOption(adminUID1, pollId, 'Red', 1);
		const opt2 = await Polls.addOption(adminUID1, pollId, 'Blue', 2);
		console.log('SUCESS: Added options with admin:', opt1, opt2);

		// Add options with user
		try {
			await Polls.addOption(user1, pollId, 'Green', 3);
			throw new Error('Expected error was not thrown, for user');
		} catch (err) {
			if (err.message.includes('no-privileges')) {
				console.log('SUCCESS: No permissions error thrown for ADD option');
			}
			else {
				throw(err);
			}
		}

		// Add options to nonexistant poll
		try {
			await Polls.addOption(adminUID1, pollId + 1, 'Green', 3);
			throw new Error('Expected error was not thrown');
		} catch (err) {
			if (err.message.includes('invalid-pollid')) {
				console.log('SUCCESS: INVALID POLL ID thrown for ADD option');
			}
			else {
				throw(err);
			}
		}

		// Simulate valid votes
		await Polls.vote(pollId, 'uid:1', opt1);
		await Polls.vote(pollId, 'uid:1', opt2);
		await Polls.vote(pollId, 'uid:1', opt1);

		//Try voting with invalid user ID
		try {
			await Polls.vote(pollId, 'uid:4', opt1);
			throw new Error('Expected error was not thrown, for invalid user');
		} catch (err) {
			if (err.message.includes('invalid-uid')) {
				console.log('SUCCESS: INVALID user ID thrown for vote option');
			}
			else {
				throw(err);
			}
		}

		try {
			await Polls.vote(pollId + 1, 'uid:1', opt1);
			throw new Error('Expected error was not thrown, for invalid poll');
		} catch (err) {
			if (err.message.includes('invalid-pollid')) {
				console.log('SUCCESS: INVALID Poll ID thrown for vote option');
			}
			else {
				throw(err);
			}
		}

		// Attempt to read invalid poll

		try {
			await await Polls.getPoll(pollId + 1);
			throw new Error('Expected error was not thrown, for invalid poll read');
		} catch (err) {
			if (err.message.includes('invalid-pollid')) {
				console.log('SUCCESS: INVALID Poll ID thrown for vote option');
			}
			else {
				throw(err);
			}
		}

		// Read valid poll and results
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
