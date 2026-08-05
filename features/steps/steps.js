const { Before, Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert');
const request = require('supertest');

// Import the built app factory directly so tests run in-process (no running
// container). `pretest` compiles src/*.ts into dist/ first, so this exercises
// the same artifact the Docker image ships.
const { createApp } = require('../../dist/app');

// The default app is built once and shared. A scenario that overrides APP_NAME
// or BASE_PATH gets its own instance, since those are read at construction.
let defaultApp = null;
let scenarioApp = null;

function getApp() {
    if (scenarioApp) {
        return scenarioApp;
    }
    if (!defaultApp) {
        defaultApp = createApp();
    }
    return defaultApp;
}

// Resolve a dot-path (e.g. "meta.count") against an object.
function getProp(obj, path) {
    return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}

// Each scenario starts with enforcement off and the default app name / base
// path, so scenarios are isolated; they opt in via the Given steps below.
Before(function () {
    delete process.env.API_KEY;
    delete process.env.APP_NAME;
    delete process.env.BASE_PATH;
    scenarioApp = null;
});

Given('no API key is configured', function () {
    delete process.env.API_KEY;
});

Given('the API key is {string}', function (key) {
    process.env.API_KEY = key;
});

Given('the app name is {string}', function (name) {
    process.env.APP_NAME = name;
    scenarioApp = createApp();
});

Given('the base path is {string}', function (basePath) {
    process.env.BASE_PATH = basePath;
    scenarioApp = createApp();
});

When('I GET {string}', async function (path) {
    this.response = await request(getApp()).get(path);
});

When('I GET {string} with api key {string}', async function (path, key) {
    this.response = await request(getApp()).get(path).set('x-api-key', key);
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
