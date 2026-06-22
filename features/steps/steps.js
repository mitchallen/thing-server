const { Before, Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert');
const request = require('supertest');

// Import the Express app directly so tests run in-process (no running container).
const app = require('../../src/app');

// Resolve a dot-path (e.g. "meta.count") against an object.
function getProp(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

// Each scenario starts with enforcement off so scenarios are isolated; auth
// scenarios opt in via "the API key is ...".
Before(function () {
    delete process.env.API_KEY;
});

Given('no API key is configured', function () {
    delete process.env.API_KEY;
});

Given('the API key is {string}', function (key) {
    process.env.API_KEY = key;
});

When('I GET {string}', async function (path) {
    this.response = await request(app).get(path);
});

When('I GET {string} with api key {string}', async function (path, key) {
    this.response = await request(app).get(path).set('x-api-key', key);
});

Then('the response status should be {int}', function (status) {
    assert.strictEqual(this.response.status, status);
});

Then('the JSON property {string} should equal {string}', function (prop, expected) {
    assert.strictEqual(getProp(this.response.body, prop), expected);
});

Then('the JSON property {string} should equal {int}', function (prop, expected) {
    assert.strictEqual(getProp(this.response.body, prop), expected);
});

Then('the response should be a JSON array with {int} items', function (count) {
    assert.ok(Array.isArray(this.response.body), 'expected a JSON array');
    assert.strictEqual(this.response.body.length, count);
});
