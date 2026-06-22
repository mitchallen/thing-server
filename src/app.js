const express = require('express'),
    app = express(),
    cors = require('cors'),
    fs = require("fs"),
    uptime = require('@mitchallen/uptime'),
    swaggerJsdoc = require('swagger-jsdoc'),
    swaggerUi = require('swagger-ui-express'),
    staticListRouter = require('./static-list-router'),
    PORT = process.env.PORT || 3000;

const APP_NAME = 'thing-server';
const APP_VERSION = require("./../package").version;

const THINGSFILE = process.env.THINGSFILE || './data/things.json';

// swagger
const EXPLORER_PATH = '/api-docs';
const API_TITLE = 'thing-server';
const API_TAG_LINE = 'A simple REST API server for returning JSON things';
const AUTHOR = 'Mitch Allen';

const customSwaggerOptions = {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: API_TITLE,
};

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: API_TITLE,
            version: APP_VERSION,
            author: AUTHOR,
            description: API_TAG_LINE,
        },
    },
    apis: [
        './src/root.yaml',
        './src/things.yaml',
        // put future route yaml here
    ],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

var contents = fs.readFileSync(`${THINGSFILE}`);
var thingsData = JSON.parse(contents);

thingsLabel = thingsData.label || 'things';
thingsPath  = thingsData.path || '/v1';
thingsList  = thingsData.list || [];

let routerThings = staticListRouter.create({
    appName: APP_NAME,
    version: APP_VERSION,
    label: thingsLabel,
    path: thingsPath,
    list: thingsList,
    port: PORT  // for console instructions
});

app.use(cors());

// Setup swagger explorer
app.use(
    EXPLORER_PATH,
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocs, customSwaggerOptions)
);

// Optional API key. When API_KEY is set, the things routes require a matching
// x-api-key header; when unset, the API is open (no enforcement). The root (/)
// and the swagger explorer remain open either way.
function apiKeyGuard(req, res, next) {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return next();
    }
    if (req.header('x-api-key') === apiKey) {
        return next();
    }
    return res.status(401).json({
        status: '401',
        error: 'unauthorized',
        app: APP_NAME,
        version: APP_VERSION
    });
}

app.use( thingsPath, apiKeyGuard );

app.use( thingsPath, routerThings );

app.get('/', function(req, res) {
    res.json({
        status: 'OK',
        app: APP_NAME,
        version: APP_VERSION,
        uptime: uptime.toHHMMSS(),
        route: "/",
        explorer: EXPLORER_PATH,
        meta: {
            label: thingsLabel,
            path: thingsPath,
            count: thingsList.length
        }
     });
});

// 404 - MUST BE LAST
// Express 5 (path-to-regexp v8) requires a named wildcard, not bare '*'
app.get('/*splat', function(req, res) {
    res.status( 404 ).json({
        status: '404',
        error: 'not found',
        app: APP_NAME,
        version: APP_VERSION
     });
});

module.exports = app;
