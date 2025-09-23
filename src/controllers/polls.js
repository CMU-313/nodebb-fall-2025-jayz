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

    // Validate option belongs to this poll
    const poll = await Polls.getPoll(pollId);
    if (!poll) return res.status(404).json({ error: 'not_found' });
    const belongs = (poll.options || []).some(o => String(o.option_id) === String(optionId));
    if (!belongs) return res.status(400).json({ error: 'invalid_option_for_poll' });

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

// Add an option to a poll
pollsController.addOption = async function (req, res) {
    const pollId = req.params.id;
    const { text, sort } = req.body || {};

    if (!validator.isInt(String(pollId))) return res.status(400).json({ error: 'invalid_poll_id' });
    if (!text || !String(text).trim()) return res.status(400).json({ error: 'missing_option_text' });

    // ensure poll exists
    const poll = await Polls.getPoll(pollId);
    if (!poll) return res.status(404).json({ error: 'not_found' });

    try {
        const optionId = await Polls.addOption(pollId, String(text).trim(), sort || 0);
        res.json({ option_id: optionId });
    } catch (err) {
        res.status(500).json({ error: 'add_option_failed' });
    }
};

require('../promisify')(pollsController, ['create', 'get', 'vote', 'results', 'addOption']);

