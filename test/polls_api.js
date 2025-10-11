'use strict';

const assert = require('assert');
const winston = require('winston');

// Silence Winston for tests to prevent memory warnings / timeouts
winston.clear();
winston.add(new winston.transports.Console({ silent: true }));

// Use the same approach as backend tests
const db = require('./mocks/databasemock');
const pollsController = require('../src/controllers/polls');
const Polls = require('../src/polls/redis');

describe('Polls Controller', function () {
	this.timeout(10000);
	
	let req, res, next;
	let capturedCalls;
	const originalMocks = {};

	before(function () {
		// Backup original methods
		originalMocks.createPoll = Polls.createPoll;
		originalMocks.addOption = Polls.addOption;
		originalMocks.getPolls = Polls.getPolls;
		originalMocks.getPoll = Polls.getPoll;
		originalMocks.getResults = Polls.getResults;

		// Mock all async Polls calls used by controllers
		Polls.createPoll = async (...args) => {
			capturedCalls.createPoll = args;
			return 1;
		};
		Polls.addOption = async (...args) => {
			capturedCalls.addOption = args;
			return 5;
		};
		Polls.getPolls = async (...args) => {
			capturedCalls.getPolls = args;
			return [{ id: 1, title: 'Poll 1' }];
		};
		Polls.getPoll = async (...args) => ({
			id: '1',
			title: 'Sample Poll',
			options: [
				{ id: '1', text: 'Option 1' },
				{ id: '2', text: 'Option 2' },
			],
		});
		Polls.getResults = async (...args) => ({
			options: [
				{ id: '1', text: 'Option 1', votes: 5 },
				{ id: '2', text: 'Option 2', votes: 3 },
			],
			totalVotes: 10,
		});
	});

	after(function () {
		// Restore original methods
		Polls.createPoll = originalMocks.createPoll;
		Polls.addOption = originalMocks.addOption;
		Polls.getPolls = originalMocks.getPolls;
		Polls.getPoll = originalMocks.getPoll;
		Polls.getResults = originalMocks.getResults;
	});

	beforeEach(function () {
		req = { body: {}, params: {}, uid: 1 };
		const jsonResponse = [];
		res = {
			statusCode: 200,
			status: function (code) { this.statusCode = code; return this; },
			json: function (data) { jsonResponse.push(data); return this; },
			_getJson: function () { return jsonResponse[jsonResponse.length - 1]; },
		};
		const nextCalls = [];
		next = function (err) { nextCalls.push(err); };
		next._getCalls = () => nextCalls;
		capturedCalls = {};
	});

	describe('create', function () {
		it('should create a poll successfully', async function () {
			req.body = { title: 'Test Poll', settings: { multi: false } };
			await pollsController.create(req, res, next);
			const response = res._getJson();
			assert.strictEqual(response.status.code, 'ok');
			assert.deepStrictEqual(capturedCalls.createPoll, ['Test Poll', 1, { multi: false }]);
		});

		it('should handle missing settings', async function () {
			req.body = { title: 'Test Poll' };
			await pollsController.create(req, res, next);
			const response = res._getJson();
			assert.strictEqual(response.status.code, 'ok');
			assert.deepStrictEqual(capturedCalls.createPoll, ['Test Poll', 1, {}]);
		});

		it('should return 400 when title is missing', async function () {
			req.body = { settings: {} };
			await pollsController.create(req, res, next);
			const response = res._getJson();
			assert.strictEqual(res.statusCode, 400);
			assert.strictEqual(response.status.code, 'error');
			assert(response.status.message.includes('required'));
		});

		it('should call next on error', async function () {
			const error = new Error('Database error');
			Polls.createPoll = async () => { throw error; };
			req.body = { title: 'Test Poll' };
			await pollsController.create(req, res, next);
			const calls = next._getCalls();
			assert.strictEqual(calls.length, 1);
			assert.strictEqual(calls[0], error);
		});
	});

	describe('addOption', function () {
		it('should add option successfully', async function () {
			req.params = { id: '1' };
			req.body = { text: 'Option A', sort: 1 };
			await pollsController.addOption(req, res, next);
			const response = res._getJson();
			assert.strictEqual(response.status.code, 'ok');
			assert.strictEqual(response.response.optionId, 5);
			assert.deepStrictEqual(capturedCalls.addOption, [1, '1', 'Option A', 1]);
		});

		it('should return 400 when text is missing', async function () {
			req.params = { id: '1' };
			req.body = { sort: 1 };
			await pollsController.addOption(req, res, next);
			const response = res._getJson();
			assert.strictEqual(res.statusCode, 400);
			assert.strictEqual(response.status.code, 'error');
			assert(response.status.message.includes('required'));
		});

		it('should call next on error', async function () {
			const error = new Error('Database error');
			Polls.addOption = async () => { throw error; };
			req.params = { id: '1' };
			req.body = { text: 'Option A' };
			await pollsController.addOption(req, res, next);
			const calls = next._getCalls();
			assert.strictEqual(calls.length, 1);
			assert.strictEqual(calls[0], error);
		});
	});

	describe('vote', function () {
		it('should return success', async function () {
			req.params = { id: '1' };
			await pollsController.vote(req, res, next);
			const response = res._getJson();
			assert.strictEqual(response.status.code, 'ok');
			assert.strictEqual(response.response.pollId, '1');
			assert.strictEqual(response.response.success, true);
		});
	});

	describe('results', function () {
		it('should return mock results', async function () {
			req.params = { id: '1' };
			await pollsController.results(req, res, next);
			const response = res._getJson();
			assert.strictEqual(response.status.code, 'ok');
			assert.strictEqual(response.response.pollId, '1');
			assert(Array.isArray(response.response.results.options));
			assert.strictEqual(response.response.results.totalVotes, 10);
		});
	});

	describe('get', function () {
		it('should return mock poll', async function () {
			req.params = { id: '1' };
			await pollsController.get(req, res, next);
			const response = res._getJson();
			assert.strictEqual(response.status.code, 'ok');
			assert.strictEqual(response.response.poll.id, '1');
			assert.strictEqual(response.response.poll.title, 'Sample Poll');
			assert(Array.isArray(response.response.poll.options));
		});
	});

});
