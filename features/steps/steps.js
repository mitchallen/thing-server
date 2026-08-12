const { Before, AfterAll, Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert');
const http = require('node:http');

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

// One listener per app instance, started lazily on an ephemeral loopback port
// and reused for the rest of the run. supertest used to stand one up per
// request; doing it here keeps the dev tree free of superagent and its
// form-data / cookiejar chain.
const servers = new Map();

function listen(app) {
    let pending = servers.get(app);
    if (!pending) {
        pending = new Promise((resolve, reject) => {
            const server = http.createServer(app);
            server.once('error', reject);
            server.listen(0, '127.0.0.1', () => resolve(server));
        });
        servers.set(app, pending);
    }
    return pending;
}

// `redirect: 'manual'` matches supertest, which does not follow redirects —
// otherwise a request to '/api-docs' would silently be reported as the 200
// from '/api-docs/' rather than the 301. The body is always drained so undici
// can release the socket, and is exposed as {} for non-JSON responses (the
// swagger explorer serves HTML, and those scenarios assert only on status).
async function get(path, headers) {
    const server = await listen(getApp());
    const { port } = server.address();
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
        headers,
        redirect: 'manual',
    });
    const text = await res.text();
    const isJson = (res.headers.get('content-type') || '').includes('application/json');
    return {
        status: res.status,
        body: isJson && text ? JSON.parse(text) : {},
        text,
    };
}

AfterAll(async function () {
    await Promise.all([...servers.values()].map(async (pending) => {
        const server = await pending;
        // undici keeps connections alive, which would stall a plain close().
        server.closeAllConnections();
        await new Promise((resolve) => server.close(resolve));
    }));
    servers.clear();
});

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
    delete process.env.THINGSFILE;
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

Given('the things file is {string}', function (file) {
    process.env.THINGSFILE = file;
    scenarioApp = createApp();
});

When('I GET {string}', async function (path) {
    this.response = await get(path);
});

When('I GET {string} with api key {string}', async function (path, key) {
    this.response = await get(path, { 'x-api-key': key });
});

// swagger-ui-express embeds the generated spec in the init script it serves,
// so this asserts against what the explorer actually renders rather than
// reaching into the app object.
When('I fetch the OpenAPI spec', async function () {
    const res = await get('/api-docs/swagger-ui-init.js');
    assert.strictEqual(res.status, 200, 'expected the swagger init script to be served');
    const match = res.text.match(/"swaggerDoc":\s*(\{.*?\}),\s*"customOptions"/s);
    assert.ok(match, 'could not find swaggerDoc in the swagger init script');
    this.spec = JSON.parse(match[1]);
});

Then('the spec should document the path {string}', function (path) {
    assert.ok(
        Object.prototype.hasOwnProperty.call(this.spec.paths, path),
        `expected the spec to document ${path}, got: ${Object.keys(this.spec.paths).join(', ')}`,
    );
});

Then('the spec should not document the path {string}', function (path) {
    assert.ok(
        !Object.prototype.hasOwnProperty.call(this.spec.paths, path),
        `expected the spec not to document ${path}`,
    );
});

Then('the spec should define the schema {string}', function (name) {
    const schemas = this.spec.components.schemas;
    assert.ok(
        Object.prototype.hasOwnProperty.call(schemas, name),
        `expected schema ${name}, got: ${Object.keys(schemas).join(', ')}`,
    );
});

Then('the spec schema {string} should describe the property {string} as {string}',
    function (name, prop, type) {
        const schema = this.spec.components.schemas[name];
        assert.ok(schema, `no schema named ${name}`);
        assert.deepStrictEqual(getProp(schema, `properties.${prop}`), { type });
    });

// A property whose entries disagree (or that is only ever null) gets an empty
// schema — OpenAPI's "any" — rather than a type some entries would violate.
Then('the spec schema {string} should claim no type for the property {string}',
    function (name, prop) {
        const schema = this.spec.components.schemas[name];
        assert.ok(schema, `no schema named ${name}`);
        assert.deepStrictEqual(getProp(schema, `properties.${prop}`), {});
    });

Then('the spec schema {string} should have no properties', function (name) {
    const schema = this.spec.components.schemas[name];
    assert.ok(schema, `no schema named ${name}`);
    assert.strictEqual(schema.properties, undefined);
    assert.strictEqual(schema.type, 'object');
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
