'use strict';

const assert = require('assert');
const pollsController = require('../src/controllers/polls');
const Polls = require('../src/polls/redis');

describe('Polls Controller (unit tests only)', () => {
	let originalCreatePoll;
	let originalAddOption;
	let originalGetPolls;

	beforeEach(() => {
		// Save original implementations
		originalCreatePoll = Polls.createPoll;
		originalAddOption = Polls.addOption;
		originalGetPolls = Polls.getPolls;
	});

	afterEach(() => {
		// Restore originals after each test
		Polls.createPoll = originalCreatePoll;
		Polls.addOption = originalAddOption;
		Polls.getPolls = originalGetPolls;
	});

	// Helper to simulate Express res object
	function makeRes() {
		const res = {};
		res.statusCode = 200;
		res.body = null;
		res.status = function (code) {
			this.statusCode = code;
			return this;
		};
		res.json = function (data) {
			this.body = data;
			return this;
		};
		return res;
	}

	// ----------------------------
	// CREATE POLL
	// ----------------------------
	it('should create a poll successfully', async () => {
		const fakePollId = 'poll123';
		Polls.createPoll = async () => fakePollId;

		const req = { body: { title: 'Favorite color?' }, uid: 1 };
		const res = makeRes();

		await pollsController.create(req, res, () => {});
		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
		assert.strictEqual(res.body.response.pollId, fakePollId);
	});

	it('should return 400 if title is missing', async () => {
		const req = { body: {}, uid: 1 };
		const res = makeRes();

		await pollsController.create(req, res, () => {});
		assert.strictEqual(res.statusCode, 400);
		assert.strictEqual(res.body.status.code, 'error');
		assert.strictEqual(res.body.status.message, 'Poll title is required');
	});

	// ----------------------------
	// ADD OPTION
	// ----------------------------
	it('should add an option successfully', async () => {
		const fakeOptionId = 'opt789';
		Polls.addOption = async () => fakeOptionId;

		const req = { params: { id: 'poll123' }, body: { text: 'Blue' }, uid: 1 };
		const res = makeRes();

		await pollsController.addOption(req, res, () => {});
		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
		assert.strictEqual(res.body.response.optionId, fakeOptionId);
	});

	it('should return 400 if option text is missing', async () => {
		const req = { params: { id: 'poll123' }, body: {}, uid: 1 };
		const res = makeRes();

		await pollsController.addOption(req, res, () => {});
		assert.strictEqual(res.statusCode, 400);
		assert.strictEqual(res.body.status.code, 'error');
		assert.strictEqual(res.body.status.message, 'Option text is required');
	});

	// ----------------------------
	// VOTE
	// ----------------------------
	it('should return ok for voting stub', async () => {
		const req = { params: { id: 'poll123' }, uid: 5 };
		const res = makeRes();

		await pollsController.vote(req, res, () => {});
		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
		assert.strictEqual(res.body.response.pollId, 'poll123');
		assert.strictEqual(res.body.response.success, true);
	});

	// ----------------------------
	// GET POLL
	// ----------------------------
	it('should get a mock poll by id', async () => {
		const req = { params: { id: 'poll42' } };
		const res = makeRes();

		await pollsController.get(req, res, () => {});
		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
		assert.strictEqual(res.body.response.poll.id, 'poll42');
		assert.strictEqual(res.body.response.poll.title, 'Sample Poll');
		assert.ok(Array.isArray(res.body.response.poll.options));
	});

	// ----------------------------
	// RESULTS
	// ----------------------------
	it('should get poll results', async () => {
		const req = { params: { id: 'poll999' } };
		const res = makeRes();

		await pollsController.results(req, res, () => {});
		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
		assert.strictEqual(res.body.response.pollId, 'poll999');
		assert.strictEqual(res.body.response.results.totalVotes, 10);
		assert.strictEqual(res.body.response.results.options.length, 3);
	});

	// ----------------------------
	// LIST POLLS
	// ----------------------------
	it('should list all polls', async () => {
		const fakePolls = [
			{ id: '1', title: 'Favorite food' },
			{ id: '2', title: 'Best programming language' },
		];
		Polls.getPolls = async () => fakePolls;

		const req = {};
		const res = makeRes();

		await pollsController.list(req, res, () => {});
		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
		assert.deepStrictEqual(res.body.response.polls, fakePolls);
	});
});
