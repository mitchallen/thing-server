import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import uptime from '@mitchallen/uptime';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as staticListRouter from './static-list-router';

const app = express();

const PORT = process.env.PORT || 3000;

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
    // The yaml files are copied into dist/ by the build, alongside the
    // compiled js; these paths are resolved against the process cwd.
    apis: [
        './dist/root.yaml',
        './dist/things.yaml',
        // put future route yaml here
    ],
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

interface ThingsData {
    label?: string;
    path?: string;
    list?: { [key: string]: any }[];
}

const contents = fs.readFileSync(`${THINGSFILE}`);
const thingsData: ThingsData = JSON.parse(contents.toString());

const thingsLabel = thingsData.label || 'things';
const thingsPath  = thingsData.path || '/v1';
const thingsList  = thingsData.list || [];

const routerThings = staticListRouter.create({
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
function apiKeyGuard(req: Request, res: Response, next: NextFunction) {
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

app.get('/', function(req: Request, res: Response) {
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
app.get('/*splat', function(req: Request, res: Response) {
    res.status( 404 ).json({
        status: '404',
        error: 'not found',
        app: APP_NAME,
        version: APP_VERSION
     });
});

export = app;
