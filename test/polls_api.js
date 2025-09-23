'use strict';

const assert = require('assert');
const request = require('../src/request');
const db = require('./mocks/databasemock');
const nconf = require('nconf');
const helpers = require('./helpers');

const baseUrl = nconf.get('url');

describe('Polls API', () => {
    let jar;
    let csrfToken;
    let createdPollId;

    before(async function () {
        this.timeout(30000);
    // Ensure admin user exists (so test can run in isolation)
    const userModule = require('../src/user');
    const groups = require('../src/groups');
    let adminUid = await userModule.getUidByUserslug('admin');
    if (!adminUid) {
        adminUid = await userModule.create({ username: 'admin', password: '123456' });
        await userModule.setUserField(adminUid, 'email', 'test@example.org');
        await userModule.email.confirmByUid(adminUid);
        await groups.join('administrators', adminUid);
    }
    // use admin user created by test bootstrap and helpers to obtain CSRF
    const loginRes = await helpers.loginUser('admin', '123456');
    ({ jar, csrf_token: csrfToken } = loginRes);
    console.log('DEBUG: login response status:', loginRes.response && loginRes.response.statusCode);
    console.log('DEBUG: login response body:', loginRes.body);
    // Debug: print cookies in jar to verify session cookie is present
    try {
        const cookieString = await jar.getCookieString(baseUrl);
        console.log('DEBUG: cookie string after login:', cookieString);
        const cookies = await jar.getCookies(baseUrl);
        console.log('DEBUG: cookies array after login:', cookies.map(c => ({ key: c.key, value: c.value, domain: c.domain, path: c.path, expires: c.expires })));
    } catch (e) {
        console.log('DEBUG: failed to read jar cookies', e && e.stack ? e.stack : e);
    }
    });

    it('should create a poll, add options, vote and return results', async () => {
        // create poll
    const createRes = await helpers.request('POST', '/api/polls', { jar, body: { title: 'My Test Poll' } });
        if (createRes.response.statusCode !== 200) {
            console.error('createRes response:', createRes.response);
            console.error('createRes body:', createRes.body);
        }
        assert.strictEqual(createRes.response.statusCode, 200);
    createdPollId = createRes.body && createRes.body.poll_id;
        assert.ok(createdPollId, 'no poll id returned');

        // add two options
    const opt1 = await helpers.request('POST', `/api/polls/${createdPollId}/options`, { jar, body: { text: 'Option A' } });
    const opt2 = await helpers.request('POST', `/api/polls/${createdPollId}/options`, { jar, body: { text: 'Option B' } });
    assert.strictEqual(opt1.response.statusCode, 200);
    assert.strictEqual(opt2.response.statusCode, 200);
        const optionId = opt1.body.option_id;

        // submit a vote
    const voteRes = await helpers.request('POST', `/api/polls/${createdPollId}/vote`, { jar, body: { option_id: optionId } });
    assert.strictEqual(voteRes.response.statusCode, 200);

        // fetch results
    const resultsRes = await request.get(`${baseUrl}/api/polls/${createdPollId}/results`, { jar });
    assert.strictEqual(resultsRes.response.statusCode, 200);
        const results = resultsRes.body.results;
        assert.ok(Array.isArray(results));
        // one of the options must show at least 1 vote
        assert.ok(results.some(r => r.votes >= 1));
    });

    after(async () => {
        if (!createdPollId) return;
        // Remove poll-related keys
        try {
            // delete poll object
            await db.deleteAll([`poll:${createdPollId}`]);
            // delete options and votes and responses
            const optionIds = await db.getListRange(`poll:${createdPollId}:options`, 0, -1) || [];
            for (const id of optionIds) {
                await db.deleteAll([`poll:option:${id}`, `poll:${createdPollId}:option:${id}:votes`]);
            }
            await db.deleteAll([`poll:${createdPollId}:options`, `poll:${createdPollId}:responses`]);
        } catch (e) {
            // best-effort cleanup
            console.error(e);
        }
    });
});
