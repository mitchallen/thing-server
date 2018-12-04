const express = require('express'),
    app = express(),
    // routerV1 = express.Router(),
    things = require('./data/v1/things.json'),
    staticListRouter = require('./static-list-router'),
    port = process.env.PORT || 3000;

const APP_NAME = 'thing-server';
const APP_VERSION = '1.0.1';    // TODO automate incrementing

const THINGS_ROUTER = '/v1';

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

let routerThings = staticListRouter.create({
    appName: APP_NAME,
    version: APP_VERSION,
    label: 'things',
    router: THINGS_ROUTER,
    list: things
});

app.use( THINGS_ROUTER, routerThings );

app.get('/', function(req, res) {
    res.json({ status: 'OK', app: APP_NAME, version: APP_VERSION, route: "/" });   
});

// routerV1.get('/', function(req, res) {
//     res.json({ status: 'OK', app: "thing-server", route: "/v1" });   
// });

// routerV1.get('/things', function(req, res) {
//     res.json( things );   
// });

// routerV1.get('/things/count', function(req, res) {
//     res.json( { count: things.length } );   
// });

// routerV1.get('/things/:id', function(req, res) {
//     // convert from 1 based to 0 based array
//     const id = parseInt(req.params.id) - 1;
//     console.log(id);
//     if( id < 0 || id >= things.length ) {
//         res.status( 404 ).send(`id ${req.params.id} out of range [1 - ${things.length}]`);
//     } else {
//         res.json( things[id] );
//     }   
// });

app.listen(port, () => console.log(`Example app listening on port ${port}!`))