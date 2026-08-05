import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import fs from 'fs';
import uptime from '@mitchallen/uptime';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import * as staticListRouter from './static-list-router';

const APP_VERSION = require("./../package").version;

const API_TAG_LINE = 'A simple REST API server for returning JSON things';
const AUTHOR = 'Mitch Allen';

// Join a base path with sub-paths, tolerating a trailing slash on the base and
// a missing leading slash on the parts. joinUrlPath('/', '/v1') === '/v1', so
// the default BASE_PATH of '/' leaves every route exactly where it was.
export const joinUrlPath = (base: string, ...paths: string[]): string => {
    const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalizedPaths = paths.map(p => p.startsWith('/') ? p : '/' + p);
    return normalizedBase + normalizedPaths.join('');
};

interface ThingsData {
    label?: string;
    path?: string;
    list?: { [key: string]: any }[];
}

// Builds the Express app. Environment is read here rather than at module load
// so a caller (notably the tests) can construct an app under a different
// APP_NAME or BASE_PATH. API_KEY is deliberately still read per-request.
export const createApp = () => {

    const app = express();

    const PORT = process.env.PORT || 3000;
    const APP_NAME = process.env.APP_NAME || 'thing-server';
    const BASE_PATH = process.env.BASE_PATH || '/';
    const THINGSFILE = process.env.THINGSFILE || './data/things.json';

    // swagger
    const EXPLORER_PATH = joinUrlPath(BASE_PATH, '/api-docs');
    const API_TITLE = APP_NAME;

    const customSwaggerOptions = {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: API_TITLE,
    };

    const swaggerOptions = {
        swaggerDefinition: {
            openapi: '3.0.0',
            servers: [
                {
                    url: BASE_PATH,     // e.g. "/api/service1"
                    description: 'Mounted base path'
                }
            ],
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

    const contents = fs.readFileSync(`${THINGSFILE}`);
    const thingsData: ThingsData = JSON.parse(contents.toString());

    const thingsLabel = thingsData.label || 'things';
    const thingsPath  = joinUrlPath(BASE_PATH, thingsData.path || '/v1');
    const thingsList  = thingsData.list || [];

    const routerThings = staticListRouter.create({
        appName: APP_NAME,
        version: APP_VERSION,
        label: thingsLabel,
        path: thingsPath,
        list: thingsList
    });

    // Resolved runtime config, for the startup banner in index.ts.
    app.locals.config = {
        appName: APP_NAME,
        version: APP_VERSION,
        basePath: BASE_PATH,
        explorerPath: EXPLORER_PATH,
        label: thingsLabel,
        path: thingsPath,
        count: thingsList.length,
        port: PORT
    };

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

    app.get(BASE_PATH, function(req: Request, res: Response) {
        res.json({
            status: 'OK',
            app: APP_NAME,
            version: APP_VERSION,
            uptime: uptime.toHHMMSS(),
            route: BASE_PATH,
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

    return app;

};

export default createApp;
