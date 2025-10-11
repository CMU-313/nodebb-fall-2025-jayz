'use strict';

const winston = require('winston');
const assert = require('assert');

// Use the same approach as backend tests
const db = require('./mocks/databasemock');
const pollsController = require('../src/controllers/polls');
const Polls = require('../src/polls/redis');

describe('Polls Controller', function () {
	let req, res, next;
	let originalCreatePoll, originalAddOption, originalGetPolls;
	let capturedCalls;

	beforeEach(function () {
		// Setup request mock
		req = {
			body: {},
			params: {},
			uid: 1,
		};

		// Setup response mock
		const jsonResponse = [];
		res = {
			statusCode: 200,
			status: function (code) {
				this.statusCode = code;
				return this;
			},
			json: function (data) {
				jsonResponse.push(data);
				return this;
			},
			_getJson: function () {
				return jsonResponse[jsonResponse.length - 1];
			},
		};

		// Setup next function
		const nextCalls = [];
		next = function (err) {
			nextCalls.push(err);
		};
		next._getCalls = function () {
			return nextCalls;
		};

		// Store original methods and setup capture
		capturedCalls = {};
		
		originalCreatePoll = Polls.createPoll;
		Polls.createPoll = function (...args) {
			capturedCalls.createPoll = args;
			return Promise.resolve(1);
		};

		originalAddOption = Polls.addOption;
		Polls.addOption = function (...args) {
			capturedCalls.addOption = args;
			return Promise.resolve(5);
		};

		originalGetPolls = Polls.getPolls;
		Polls.getPolls = function (...args) {
			capturedCalls.getPolls = args;
			return Promise.resolve([{ id: 1, title: 'Poll 1' }]);
		};
	});

	afterEach(function () {
		// Restore original methods
		Polls.createPoll = originalCreatePoll;
		Polls.addOption = originalAddOption;
		Polls.getPolls = originalGetPolls;
	});

	// Tests successful poll creation with valid title and settings
	describe('create', function () {
		it('should create a poll successfully', async function () {
			req.body = { title: 'Test Poll', settings: { multi: false } };

			await pollsController.create(req, res, next);

			const response = res._getJson();
			console.log('Response:', response);
			console.log('Captured calls:', capturedCalls.createPoll);
			assert.strictEqual(response.status.code, 'ok');
			assert.strictEqual(response.response.pollId, 1);
			assert.deepStrictEqual(capturedCalls.createPoll, ['Test Poll', 1, { multi: false }]);
		});

		// Test that poll creation handles missing settings by defaulting to empty object
		it('should handle missing settings', async function () {
			req.body = { title: 'Test Poll' };

			await pollsController.create(req, res, next);

			const response = res._getJson();
			console.log('Response with default settings:', response);
			console.log('Captured calls:', capturedCalls.createPoll);
			assert.strictEqual(response.status.code, 'ok');
			assert.deepStrictEqual(capturedCalls.createPoll, ['Test Poll', 1, {}]);
		});
		// Test that missing poll title returns 400 error
		it('should return 400 when title is missing', async function () {
			req.body = { settings: {} };

			await pollsController.create(req, res, next);

			console.log('Status code:', res.statusCode);
			const response = res._getJson();
			console.log('Error response:', response);
			assert.strictEqual(res.statusCode, 400);
			assert.strictEqual(response.status.code, 'error');
			assert(response.status.message.includes('required'));
		});
		// Test that errors thrown during createPoll are passed to next error handler
		it('should call next on error', async function () {
			req.body = { title: 'Test Poll' };
			const error = new Error('Database error');
			
			Polls.createPoll = function () {
				return Promise.reject(error);
			};

			await pollsController.create(req, res, next);

			const calls = next._getCalls();
			console.log('next() calls:', calls.length);
			console.log('Error passed to next():', calls[0]);
			assert.strictEqual(calls.length, 1);
			assert.strictEqual(calls[0], error);
		});
	});
	// Tests for adding options to existing polls
	describe('addOption', function () {
		// Test successful option addition with specific text and sort order
		it('should add option successfully', async function () {
			req.params = { id: '1' };
			req.body = { text: 'Option A', sort: 1 };

			await pollsController.addOption(req, res, next);

			const response = res._getJson();
			console.log('Add option response:', response);
			console.log('Captured calls:', capturedCalls.addOption);
			assert.strictEqual(response.status.code, 'ok');
			assert.strictEqual(response.response.optionId, 5);
			assert.deepStrictEqual(capturedCalls.addOption, [1, '1', 'Option A', 1]);
		});

		// Test that missing option text returns 400 error
		it('should return 400 when text is missing', async function () {
			req.params = { id: '1' };
			req.body = { sort: 1 };

			await pollsController.addOption(req, res, next);

			assert.strictEqual(res.statusCode, 400);
			const response = res._getJson();
			assert.strictEqual(response.status.code, 'error');
			assert(response.status.message.includes('required'));
		});
		// Test that errors thrown during addOption are passed to next error handler
		it('should call next on error', async function () {
			req.params = { id: '1' };
			req.body = { text: 'Option A' };
			const error = new Error('Database error');
			
			Polls.addOption = function () {
				return Promise.reject(error);
			};

			await pollsController.addOption(req, res, next);

			const calls = next._getCalls();
			console.log('addOption error - next() calls:', calls.length);
			console.log('Error:', calls[0]);
			assert.strictEqual(calls.length, 1);
			assert.strictEqual(calls[0], error);
		});
	});
	// Tests for voting on polls
	describe('vote', function () {
		// Test that voting returns success response
		it('should return success', async function () {
			req.params = { id: '1' };

			await pollsController.vote(req, res, next);

			const response = res._getJson();
			console.log('Vote response:', response);
			assert.strictEqual(response.status.code, 'ok');
			assert.strictEqual(response.response.pollId, '1');
			assert.strictEqual(response.response.success, true);
		});

		// Test that errors during vote response are passed to next error handler
		it('should call next on error', async function () {
			req.params = { id: '1' };
			const error = new Error('Vote error');
			
			// Force an error by making res.json throw
			res.json = function () {
				throw error;
			};

			await pollsController.vote(req, res, next);

			const calls = next._getCalls();
			console.log('Vote error - next() calls:', calls.length);
			assert.strictEqual(calls.length, 1);
			assert.strictEqual(calls[0], error);
		});
	});

	// Tests for retrieving poll results
	describe('results', function () {
		// Test that results return valid mock data including options array and total votes count
		it('should return mock results', async function () {
			req.params = { id: '1' };

			await pollsController.results(req, res, next);

			const response = res._getJson();
			console.log('Results response:', response);
			assert.strictEqual(response.status.code, 'ok');
			assert.strictEqual(response.response.pollId, '1');
			assert(response.response.results);
			assert(Array.isArray(response.response.results.options));
			assert.strictEqual(response.response.results.totalVotes, 10);
		});

		// Test that errors in results cause next to be called with the error
		it('should call next on error', async function () {
			req.params = { id: '1' };
			const error = new Error('Results error');
			
			res.json = function () {
				throw error;
			};

			await pollsController.results(req, res, next);

			const calls = next._getCalls();
			console.log('Results error - next() calls:', calls.length);
			assert.strictEqual(calls.length, 1);
			assert.strictEqual(calls[0], error);
		});
	});

	// Tests for retrieving a single poll
	describe('get', function () {
		// Test that a single poll is returned with expected id, title and options array
		it('should return mock poll', async function () {
			req.params = { id: '1' };

			await pollsController.get(req, res, next);

			const response = res._getJson();
			console.log('Get poll response:', response);
			assert.strictEqual(response.status.code, 'ok');
			assert(response.response.poll);
			assert.strictEqual(response.response.poll.id, '1');
			assert.strictEqual(response.response.poll.title, 'Sample Poll');
			assert(Array.isArray(response.response.poll.options));
		});

		// Test that errors in getting the poll are passed to next error handler
		it('should call next on error', async function () {
			req.params = { id: '1' };
			const error = new Error('Get error');
			
			res.json = function () {
				throw error;
			};

			await pollsController.get(req, res, next);

			const calls = next._getCalls();
			console.log('Get error - next() calls:', calls.length);
			assert.strictEqual(calls.length, 1);
			assert.strictEqual(calls[0], error);
		});
	});

});