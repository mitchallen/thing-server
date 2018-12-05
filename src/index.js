const express = require('express'),
    app = express(),
    things = require('./data/v1/things.json'),
    staticListRouter = require('./static-list-router'),
    PORT = process.env.PORT || 3000;

const APP_NAME = 'thing-server';
const APP_VERSION = '1.0.6';    // TODO automate incrementing
const THINGS_PATH = '/v1';

let routerThings = staticListRouter.create({
    appName: APP_NAME,
    version: APP_VERSION,
    label: 'things',
    path: THINGS_PATH,
    list: things,
    port: PORT  // for console instructions
});

app.use( THINGS_PATH, routerThings );

app.get('/', function(req, res) {
    res.json({ status: 'OK', app: APP_NAME, version: APP_VERSION, route: "/" });   
});

// 404 - MUST BE LAST
app.get('*', function(req, res) {
    res.status( 404 ).json({ 
        status: '404', 
        error: 'not found',
        app: APP_NAME, 
        version: APP_VERSION
     });   
});

app.listen(PORT, () => console.log(`${APP_NAME}:${APP_VERSION} - listening on port ${PORT}!`))