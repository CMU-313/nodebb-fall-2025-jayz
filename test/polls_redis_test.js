'use strict';

const db = require('../src/database');
const Polls = require('../src/polls/redis');

async function run() {
	console.log('Starting Redis Polls test');
	// initialize DB
	if (typeof db.init === 'function') await db.init();

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
	console.log('Poll object:', poll.poll);
	console.log('Options:', poll.options);

	const results = await Polls.getResults(pollId);
	console.log('Results:', results);

	console.log('Test complete');
	process.exit(0);
}

run().catch(err => { console.error('Test failed', err); process.exit(1); });
