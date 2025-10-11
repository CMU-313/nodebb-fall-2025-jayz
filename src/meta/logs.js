'use strict';

const path = require('path');
const fs = require('fs');

const Logs = module.exports;

Logs.path = path.resolve(__dirname, '../../logs/output.log');

Logs.get = async function () {
	try {
		return await fs.promises.readFile(Logs.path, 'utf-8');
	} catch (err) {
		if (err.code === 'ENOENT') return ''; // return empty log if missing
		throw err;
	}
};

Logs.clear = async function () {
	try {
		await fs.promises.truncate(Logs.path, 0);
	} catch (err) {
		if (err.code === 'ENOENT') {
			await fs.promises.mkdir(path.dirname(Logs.path), { recursive: true });
			await fs.promises.writeFile(Logs.path, '');
		} else {
			throw err;
		}
	}
};
