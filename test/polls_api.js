'use strict';

const pollsController = require('../src/controllers/polls');
const assert = require('assert');
const { adminUID1, user1 } = require('../src/polls/redis');

function makeRes() {
	const res = {};
	res.statusCode = 200;
	res.body = null;
	res.status = function (code) { this.statusCode = code; return this; };
	res.json = function (data) { this.body = data; return this; };
	return res;
}

let savedPollId;

describe('Polls Controller (reuse users)', function () {
	it('should create a poll with admin', async function () {
		const req = { body: { title: 'Controller test poll' }, uid: adminUID1 };
		const res = makeRes();
		const next = (err) => { if (err) throw err; };

		await pollsController.create(req, res, next);

		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
		assert.strictEqual(res.uid, adminUID1);
		savedPollId = res.body.response.pollId;
		console.log('Created POLL ID:', res.body.response.pollId);
	});

	it('should add an option to a poll', async function () {
		const req = { params: { id: savedPollId }, body: { text: 'Option A', sort: 0 }, uid: adminUID1 };
		const res = makeRes();
		const next = (err) => { if (err) throw err; };

		await pollsController.addOption(req, res, next);

		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
		assert.ok(res.body.response.optionId);
	});

	it('should vote on a poll', async function () {
		const req = { params: { id: savedPollId }, body: {}, uid: user1 };
		const res = makeRes();
		const next = (err) => { if (err) throw err; };

		await pollsController.vote(req, res, next);

		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
		assert.strictEqual(res.body.response.success, true);
	});

	it('should get poll results', async function () {
		const req = { params: { id: savedPollId } };
		const res = makeRes();
		const next = (err) => { if (err) throw err; };

		await pollsController.results(req, res, next);

		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
		assert.ok(res.body.response.results.totalVotes >= 0);
	});

	it('should return all polls', async function () {
		const req = {}; // no special properties needed
		const res = makeRes();
		const next = (err) => { if (err) throw err; };

		await pollsController.list(req, res, next);

		// Assertions
		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
	});

});

