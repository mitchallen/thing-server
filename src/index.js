const express = require('express'),
    app = express(),
    things = require('./data/v1/things.json'),
    staticListRouter = require('./static-list-router'),
    PORT = process.env.PORT || 3000;

const APP_NAME = 'thing-server';
const APP_VERSION = '1.0.2';    // TODO automate incrementing

const THINGS_ROUTER = '/v1';

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let routerThings = staticListRouter.create({
    appName: APP_NAME,
    version: APP_VERSION,
    label: 'things',
    router: THINGS_ROUTER,
    list: things,
    port: PORT  // for console instructions
});

app.use( THINGS_ROUTER, routerThings );

app.get('/', function(req, res) {
    res.json({ status: 'OK', app: APP_NAME, version: APP_VERSION, route: "/" });   
});

app.listen(PORT, () => console.log(`${APP_NAME}:${APP_VERSION} - listening on port ${PORT}!`))