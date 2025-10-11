'use strict';

const assert = require('assert');
const Polls = require('../src/polls/redis');

// ----------------------------
// MOCK POLLS METHODS
// ----------------------------
Polls.addOption = async (uid, pollId, text, sort) => 'fakeOptionId';
Polls.getPolls = async () => [
	{ id: '1', title: 'Favorite food' },
	{ id: '2', title: 'Best programming language' },
];

const pollsController = require('../src/controllers/polls');

// ----------------------------
// HELPER RES OBJECT
// ----------------------------
function makeRes() {
	const res = {};
	res.statusCode = 200;
	res.body = null;
	res.status = function (code) { this.statusCode = code; return this; };
	res.json = function (data) { this.body = data; return this; };
	return res;
}

// ----------------------------
// TESTS
// ----------------------------
describe('Polls Controller (unit tests only)', () => {


	it('should add an option successfully', async () => {
		const req = { params: { id: '123' }, body: { text: 'Blue' }, uid: 1 };
		const res = makeRes();

		await pollsController.addOption(req, res, () => {});

		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
		assert.strictEqual(res.body.response.optionId, 'fakeOptionId');
	});

	it('should list all polls', async () => {
		const req = {};
		const res = makeRes();

		await pollsController.list(req, res, () => {});

		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
		assert.deepStrictEqual(res.body.response.polls, Polls.getPolls());
	});

});
