'use strict';

const winston = require('winston');
const assert = require('assert');

// Use the same approach as backend tests
const db = require('./mocks/databasemock');
const pollsController = require('../src/controllers/polls');
const Polls = require('../src/polls/redis');

describe('Polls Controller', function () {
    this.timeout(30000);
    let req, res, next;
    let originalCreatePoll, originalAddOption, originalGetPolls;
    let originalVote, originalGetResults, originalGetPoll;
    let capturedCalls;

    beforeEach(function () {
        // Setup request mock
        req = {
            body: {},
            params: {},
            uid: 1,
        };

        // Setup response mock
        const jsonResponse = [];
        res = {
            statusCode: 200,
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                jsonResponse.push(data);
                return this;
            },
            _getJson: function () {
                return jsonResponse[jsonResponse.length - 1];
            },
        };

        // Setup next function
        const nextCalls = [];
        next = function (err) {
            nextCalls.push(err);
        };
        next._getCalls = function () {
            return nextCalls;
        };

        // Store original methods and setup capture
        capturedCalls = {};

        originalCreatePoll = Polls.createPoll;
        Polls.createPoll = function (...args) {
            capturedCalls.createPoll = args;
            return Promise.resolve(1);
        };

        originalAddOption = Polls.addOption;
        Polls.addOption = function (...args) {
            capturedCalls.addOption = args;
            return Promise.resolve(5);
        };

        originalGetPolls = Polls.getPolls;
        Polls.getPolls = function (...args) {
            capturedCalls.getPolls = args;
            return Promise.resolve([{ id: 1, title: 'Poll 1' }]);
        };

        // Add missing mocks to prevent hanging
        originalVote = Polls.vote;
        Polls.vote = function (...args) {
            capturedCalls.vote = args;
            return Promise.resolve({ success: true });
        };

        originalGetResults = Polls.getResults;
        Polls.getResults = function (...args) {
            capturedCalls.getResults = args;
            return Promise.resolve({
                options: [],
                totalVotes: 10,
            });
        };

        originalGetPoll = Polls.getPoll;
        Polls.getPoll = function (...args) {
            capturedCalls.getPoll = args;
            return Promise.resolve({
                id: '1',
                title: 'Sample Poll',
                options: [],
            });
        };
    });

    afterEach(function () {
        // Restore original methods
        Polls.createPoll = originalCreatePoll;
        Polls.addOption = originalAddOption;
        Polls.getPolls = originalGetPolls;
        Polls.vote = originalVote;
        Polls.getResults = originalGetResults;
        Polls.getPoll = originalGetPoll;
    });

    // Tests successful poll creation with valid title and settings
    describe('create', function () {
        it('should create a poll successfully', async function () {
            req.body = { title: 'Test Poll', settings: { multi: false } };

            await pollsController.create(req, res, next);

            const response = res._getJson();
            console.log('Response:', response);
            console.log('Captured calls:', capturedCalls.createPoll);
            assert.strictEqual(response.status.code, 'ok');
            assert.deepStrictEqual(capturedCalls.createPoll, ['Test Poll', 1, { multi: false }]);
        });
    });
});
