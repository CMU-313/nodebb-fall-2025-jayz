
'use strict';

const assert = require('assert');
const sinon = require('sinon');
const request = require('supertest');
const express = require('express');

const pollsController = require('../src/controllers/polls');
const Polls = require('../src/polls/redis');
const winston = require('winston');


winston.add(new winston.transports.Console({
	format: winston.format.combine(
		winston.format.splat(),
		winston.format.simple()
	),
}));

describe('Polls Controller', () => {
	let app;
	let sandbox;

	before(() => {
		// Create an Express app and mount routes
		app = express();
		app.use(express.json());
		app.post('/polls', (req, res, next) => {
			// Simulate an authenticated user
			req.uid = 1;
			return pollsController.create(req, res, next);
		});
		app.get('/polls', (req, res, next) => pollsController.list(req, res, next));
		app.get('/polls/:id', (req, res, next) => pollsController.get(req, res, next));
		app.post('/polls/:id/vote', (req, res, next) => pollsController.vote(req, res, next));
		app.post('/polls/:id/options', (req, res, next) => {
			req.uid = 1;
			return pollsController.addOption(req, res, next);
		});
		app.get('/polls/:id/results', (req, res, next) => pollsController.results(req, res, next));
	});

	beforeEach(() => {
		sandbox = sinon.createSandbox();
	});

	afterEach(() => {
		sandbox.restore();
	});

	// ----------------------------
	// CREATE POLL
	// ----------------------------
	it('should create a poll successfully', async () => {
		const fakePollId = 'poll123';
		sandbox.stub(Polls, 'createPoll').resolves(fakePollId);

		const res = await request(app)
			.post('/polls')
			.send({ title: 'Favorite color?' })
			.expect(200);

		assert.strictEqual(res.body.status.code, 'ok');
		assert.strictEqual(res.body.response.pollId, fakePollId);
	});

	it('should return 400 if title is missing', async () => {
		const res = await request(app)
			.post('/polls')
			.send({})
			.expect(400);

		assert.strictEqual(res.body.status.code, 'error');
		assert.strictEqual(res.body.status.message, 'Poll title is required');
	});

	// ----------------------------
	// ADD OPTION
	// ----------------------------
	it('should add an option successfully', async () => {
		const fakeOptionId = 'opt789';
		sandbox.stub(Polls, 'addOption').resolves(fakeOptionId);

		const res = await request(app)
			.post('/polls/poll123/options')
			.send({ text: 'Blue' })
			.expect(200);

		assert.strictEqual(res.body.status.code, 'ok');
		assert.strictEqual(res.body.response.optionId, fakeOptionId);
	});

	it('should return 400 if option text is missing', async () => {
		const res = await request(app)
			.post('/polls/poll123/options')
			.send({})
			.expect(400);

		assert.strictEqual(res.body.status.code, 'error');
		assert.strictEqual(res.body.status.message, 'Option text is required');
	});

	// ----------------------------
	// VOTE
	// ----------------------------
	it('should return ok for voting stub', async () => {
		const res = await request(app)
			.post('/polls/poll123/vote')
			.expect(200);

		assert.strictEqual(res.body.status.code, 'ok');
		assert.strictEqual(res.body.response.pollId, 'poll123');
		assert.strictEqual(res.body.response.success, true);
		console.log('THIS RAN !!!!');
	});

	// ----------------------------
	// GET POLL
	// ----------------------------
	it('should get a mock poll by id', async () => {
		const res = await request(app)
			.get('/polls/poll42')
			.expect(200);

		assert.strictEqual(res.body.status.code, 'ok');
		assert.strictEqual(res.body.response.poll.id, 'poll42');
		assert.strictEqual(res.body.response.poll.title, 'Sample Poll');
		assert.ok(Array.isArray(res.body.response.poll.options));
	});

	// ----------------------------
	// RESULTS
	// ----------------------------
	it('should get poll results', async () => {
		const res = await request(app)
			.get('/polls/poll999/results')
			.expect(200);

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
		sandbox.stub(Polls, 'getPolls').resolves(fakePolls);

		const res = await request(app)
			.get('/polls')
			.expect(200);

		assert.strictEqual(res.body.status.code, 'ok');
		assert.deepStrictEqual(res.body.response.polls, fakePolls);
	});
});
