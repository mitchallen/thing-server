const express = require('express'),
    app = express(),
    fs = require("fs"),
    uptime = require('@mitchallen/uptime'),
    staticListRouter = require('./static-list-router'),
    PORT = process.env.PORT || 3000;

const APP_NAME = 'thing-server';
const APP_VERSION = require("./../package").version;   

const THINGSFILE = process.env.THINGSFILE || './data/things.json';

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

app.use( thingsPath, routerThings );

app.get('/', function(req, res) {
    res.json({ 
        status: 'OK', 
        app: APP_NAME, 
        version: APP_VERSION, 
        uptime: uptime.toHHMMSS(),
        route: "/",
        meta: {
            label: thingsLabel,
            path: thingsPath,
            count: thingsList.length
        }
     });   
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