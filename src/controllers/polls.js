"use strict";

const Polls = require('../polls/redis');
const validator = require('validator');

const pollsController = module.exports;

// Create a poll
pollsController.create = async function (req, res) {
    const { title, instructor_uid: instructorUid, settings } = req.body || {};
    if (!title || !String(title).trim()) {
        return res.status(400).json({ error: 'missing_title' });
    }

    const pollId = await Polls.createPoll(String(title).trim(), instructorUid || null, settings || {});
    res.json({ poll_id: pollId });
};

// Get a poll (with options)
pollsController.get = async function (req, res) {
    const pollId = req.params.id;
    if (!validator.isInt(String(pollId))) {
        return res.status(400).json({ error: 'invalid_poll_id' });
    }
    const data = await Polls.getPoll(pollId);
    if (!data) return res.status(404).json({ error: 'not_found' });
    res.json(data);
};

// Submit a vote/response
pollsController.vote = async function (req, res) {
    const pollId = req.params.id;
    const { option_id: optionId } = req.body || {};
    const uid = req.uid >= 0 ? req.uid : null;

    if (!validator.isInt(String(pollId))) return res.status(400).json({ error: 'invalid_poll_id' });
    if (!optionId) return res.status(400).json({ error: 'missing_option_id' });

    try {
        await Polls.vote(pollId, uid, optionId);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'vote_failed' });
    }
};

// Get poll results
pollsController.results = async function (req, res) {
    const pollId = req.params.id;
    if (!validator.isInt(String(pollId))) return res.status(400).json({ error: 'invalid_poll_id' });
    const results = await Polls.getResults(pollId);
    res.json({ results });
};

require('../promisify')(pollsController, ['create', 'get', 'vote', 'results']);
