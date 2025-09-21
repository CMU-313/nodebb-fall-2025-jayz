'use strict';

const db = require('../database');

/**
 * Redis-backed Polls implementation
 * Data model (Redis keys):
 * - poll:next_id -> INCR for new poll IDs
 * - poll:<pollId> -> object (hash) stored via db.setObject
 * - poll:<pollId>:options -> list (RPUSH) of option ids
 * - poll:option:next_id -> INCR for option ids
 * - poll:option:<optionId> -> object (hash)
 * - poll:<pollId>:responses -> hash of uid -> optionId
 */

const Polls = {};

Polls.createPoll = async function (title, instructorUid = null, settings = {}) {
	const pollId = await db.increment('poll:next_id');
	const key = `poll:${pollId}`;
	const now = Date.now();
	const obj = {
		poll_id: pollId,
		title: title,
		instructor_uid: instructorUid || null,
		settings: JSON.stringify(settings || {}),
		created_at: now,
		updated_at: now,
	};

	await db.setObject(key, obj);
	// track polls in a sorted set
	await db.sortedSetAdd('poll:ids', now, pollId);
	return pollId;
};

Polls.addOption = async function (pollId, text, sort = 0) {
	const optionId = await db.increment('poll:option:next_id');
	const key = `poll:option:${optionId}`;
	const obj = {
		option_id: optionId,
		poll_id: pollId,
		text: text,
		sort: sort,
	};
	await db.setObject(key, obj);
	// push option id to poll options list
	await db.listAppend(`poll:${pollId}:options`, optionId);
	return optionId;
};

Polls.getPoll = async function (pollId) {
	const key = `poll:${pollId}`;
	const pollObj = await db.getObject(key);
	if (!pollObj) return null;
	const optionIds = await db.getListRange(`poll:${pollId}:options`, 0, -1) || [];
	const optionKeys = optionIds.map(id => `poll:option:${id}`);
	const options = optionKeys.length ? await db.getObjects(optionKeys) : [];
	// parse settings
	try { pollObj.settings = JSON.parse(pollObj.settings || '{}'); } catch (e) { pollObj.settings = {}; }
	return { poll: pollObj, options: options.filter(Boolean) };
};

Polls.vote = async function (pollId, uid, optionId) {
	// Single-choice polls store uid->optionId in a hash
	const responsesKey = `poll:${pollId}:responses`;
	const votesKey = optId => `poll:${pollId}:option:${optId}:votes`;

	// Read previous vote (if any)
	const prev = await db.getObjectField(responsesKey, uid);
	if (prev && String(prev) === String(optionId)) {
		// idempotent: same vote, nothing to do
		return true;
	}

	// Perform an atomic transaction: set new response, increment new option votes,
	// and decrement previous option votes if present.
	// We use the underlying redis client MULTI/EXEC via db.client
	// The db adapter exposes the redis client at db.client
	const { client } = db;
	if (!client || !client.multi) {
		// Fallback to non-atomic behaviour if transaction isn't available
		await db.setObjectField(responsesKey, uid, optionId);
		await db.increment(votesKey(optionId));
		if (prev) {
			await db.decrObjectField(votesKey(prev), '0');
		}
		return true;
	}

	const multi = client.multi();
	// set user's response in the responses hash
	multi.hset(responsesKey, String(uid), String(optionId));
	// increment the new option's votes
	multi.incr(votesKey(optionId));
	// decrement previous option's votes (only if prev exists)
	if (prev) {
		multi.decr(votesKey(prev));
	}

	await multi.exec();
	return true;
};

Polls.getResults = async function (pollId) {
	const optionIds = await db.getListRange(`poll:${pollId}:options`, 0, -1) || [];
	if (!optionIds.length) return [];

	const promises = optionIds.map((optId) => {
		const votesKey = `poll:${pollId}:option:${optId}:votes`;
		const optKey = `poll:option:${optId}`;
		return Promise.all([db.getObject(optKey), db.get(votesKey)]);
	});

	const rows = await Promise.all(promises);
	const results = rows.map(([opt, votesStr]) => {
		const votes = parseInt(votesStr || 0, 10) || 0;
		return opt ? { option: opt, votes } : null;
	}).filter(Boolean);

	return results;
};

module.exports = Polls;
