"use strict";

const Polls = require('../polls/redis');
const validator = require('validator');
const helpers = require('./helpers');

const pollsController = module.exports;

// Create a poll
pollsController.create = async function (req, res) {
    const { title, instructor_uid: instructorUid, settings } = req.body || {};
    if (!title || !String(title).trim()) {
        return helpers.formatApiResponse(400, res, new Error('[[error:missing-title]]'));
    }

    const pollId = await Polls.createPoll(String(title).trim(), instructorUid || null, settings || {});
    return helpers.formatApiResponse(200, res, { poll_id: String(pollId) });
};

// Get a poll (with options)
pollsController.get = async function (req, res) {
    const pollId = req.params.id;
    if (!validator.isInt(String(pollId))) {
        return helpers.formatApiResponse(400, res, new Error('[[error:invalid-poll-id]]'));
    }

    const data = await Polls.getPoll(pollId);
    if (!data) return helpers.formatApiResponse(404, res, new Error('[[error:no-poll]]'));

    // Include vote counts in the response to satisfy OpenAPI schema
    const results = await Polls.getResults(pollId);
    const options = (data.options || []).map((opt) => {
        const row = results.find(r => String(r.option.option_id) === String(opt.option_id));
        return {
            id: String(opt.option_id),
            text: opt.text,
            votes: row ? row.votes : 0,
        };
    });

    const votesObj = {};
    options.forEach((o) => { votesObj[o.id] = o.votes; });

    const pollPayload = {
        poll: {
            id: String(data.poll.poll_id),
            title: data.poll.title,
            options: options,
            votes: votesObj,
            created: data.poll.created_at,
        },
    };

    return helpers.formatApiResponse(200, res, pollPayload);
};

// Submit a vote/response
pollsController.vote = async function (req, res) {
    const pollId = req.params.id;
    const { option_id: optionId } = req.body || {};
    const uid = req.uid >= 0 ? req.uid : null;

    if (!validator.isInt(String(pollId))) return helpers.formatApiResponse(400, res, new Error('[[error:invalid-poll-id]]'));
    if (!optionId) return helpers.formatApiResponse(400, res, new Error('[[error:missing-option-id]]'));

    // Validate option belongs to this poll
    const poll = await Polls.getPoll(pollId);
    if (!poll) return helpers.formatApiResponse(404, res, new Error('[[error:no-poll]]'));
    const belongs = (poll.options || []).some(o => String(o.option_id) === String(optionId));
    if (!belongs) return helpers.formatApiResponse(400, res, new Error('[[error:invalid-option-for-poll]]'));

    try {
        await Polls.vote(pollId, uid, optionId);
        return helpers.formatApiResponse(200, res, { success: true });
    } catch (err) {
        return helpers.formatApiResponse(500, res, new Error('[[error:vote-failed]]'));
    }
};

// Get poll results
pollsController.results = async function (req, res) {
    const pollId = req.params.id;
    if (!validator.isInt(String(pollId))) return helpers.formatApiResponse(400, res, new Error('[[error:invalid-poll-id]]'));

    const poll = await Polls.getPoll(pollId);
    if (!poll) return helpers.formatApiResponse(404, res, new Error('[[error:no-poll]]'));

    const results = await Polls.getResults(pollId);
    const options = results.map(r => ({ id: String(r.option.option_id), text: r.option.text, votes: r.votes }));
    const totalVotes = options.reduce((sum, o) => sum + (o.votes || 0), 0);

    const payload = {
        pollId: String(pollId),
        results: {
            options,
            totalVotes,
        },
    };

    return helpers.formatApiResponse(200, res, payload);
};

// Add an option to a poll
pollsController.addOption = async function (req, res) {
    const pollId = req.params.id;
    const { text, sort } = req.body || {};

    if (!validator.isInt(String(pollId))) return helpers.formatApiResponse(400, res, new Error('[[error:invalid-poll-id]]'));
    if (!text || !String(text).trim()) return helpers.formatApiResponse(400, res, new Error('[[error:missing-option-text]]'));

    // ensure poll exists
    const poll = await Polls.getPoll(pollId);
    if (!poll) return helpers.formatApiResponse(404, res, new Error('[[error:no-poll]]'));

    try {
        const optionId = await Polls.addOption(pollId, String(text).trim(), sort || 0);
        return helpers.formatApiResponse(200, res, { option_id: String(optionId) });
    } catch (err) {
        return helpers.formatApiResponse(500, res, new Error('[[error:add-option-failed]]'));
    }
};

require('../promisify')(pollsController, ['create', 'get', 'vote', 'results', 'addOption']);

