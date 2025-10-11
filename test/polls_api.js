'use strict';
console.log('HERE1');

const assert = require('assert');
const Polls = require('../src/polls/redis');
console.log('HERE2');

// ----------------------------
// MOCK POLLS METHODS
// ----------------------------
Polls.createPoll = async (title, uid, settings) => 'fakePollId';
Polls.addOption = async (uid, pollId, text, sort) => 'fakeOptionId';
Polls.getPolls = async () => [
	{ id: '1', title: 'Favorite food' },
	{ id: '2', title: 'Best programming language' },
];
console.log('HERE3');

const pollsController = require('../src/controllers/polls');
console.log('HERE4');

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
console.log('HERE5');

// ----------------------------
// TESTS
// ----------------------------
describe('Polls Controller (unit tests only)', () => {
	console.log('HERE6');
	it('should create a poll successfully', async () => {
		console.log('HERE45');
		const req = { body: { title: 'Favorite color?' }, uid: 1 };
		console.log('HERE46');
		const res = makeRes();
		console.log('HERE47');
		const next = (err) => {
			if (err) throw err; };
		
		console.log('HERE7');

		await pollsController.create(req, res, next);

		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
		assert.strictEqual(res.body.response.pollId, 'fakePollId');
		console.log('passed this and still timed out');
	});

	it('should add an option successfully', async () => {
		const req = { params: { id: '123' }, body: { text: 'Blue' }, uid: 1 };
		const res = makeRes();
		const next = (err) => {
			if (err) throw err; };

		await pollsController.addOption(req, res, next);

		assert.strictEqual(res.statusCode, 200);
		assert.strictEqual(res.body.status.code, 'ok');
		assert.strictEqual(res.body.response.optionId, 'fakeOptionId');
	});


});
