/*
 * Redis migration: initialize keys/counters used by the Redis-backed Polls module
 * Runs only when database is redis
 */
'use strict';

const nconf = require('nconf');
const db = require('../../database');

module.exports = {
	name: 'Initialize Redis keys for Polls module',
	timestamp: Date.UTC(2025, 8, 19, 19, 0),
	method: async function () {
		// Only run this migration when using Redis
		if (nconf.get('database') !== 'redis') {
			return;
		}

		// initialize redis connection if needed
		if (typeof db.init === 'function') {
			try {
				await db.init();
			} catch (e) {
				// ignore - db may already be initialized
			}
		}

		// Idempotent initialization: only set counters if they don't exist
		const tasks = [];

		// Ensure poll id counter exists (set to 0 if missing)
		tasks.push(db.get('poll:next_id').then((v) => {
			if (v === null) {
				return db.set('poll:next_id', 0);
			}
			return null;
		}));

		// Ensure option id counter exists
		tasks.push(db.get('poll:option:next_id').then((v) => {
			if (v === null) {
				return db.set('poll:option:next_id', 0);
			}
			return null;
		}));

		// Ensure polls sorted set exists (create-and-remove temp member if key missing)
		tasks.push(db.get('poll:ids').then((v) => {
			if (v === null) {
				const tmp = `tmp:${Date.now()}:${Math.random().toString(36).slice(2,8)}`;
				return db.sortedSetAdd('poll:ids', Date.now(), tmp).then(() => db.sortedSetRemove('poll:ids', tmp));
			}
			return null;
		}));

		await Promise.all(tasks);
	},
};
