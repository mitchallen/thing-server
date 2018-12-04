
var listRouter = require('express').Router();

module.exports.create = (spec) => {

    spec = spec || {};

    const appName = spec.appName || 'app';
    const version = spec.version || '0.0.1';
    const label = spec.label || 'objects';
    const route = spec.router || '/api';
    const list = spec.list || [{id: 1, title: "TODO" }];
    const port = spec.port || '';   // for console instructions

    console.log("vvv --- EXAMPLES --- vvv");
    console.log(`curl http://localhost:${port}/`);
    console.log(`curl http://localhost:${port}${route}`);
    console.log(`curl http://localhost:${port}${route}/${label}`);
    console.log(`curl http://localhost:${port}${route}/${label}/count`);
    console.log(`curl http://localhost:${port}${route}/${label}/1`);
    console.log("^^ --- ^^^^^^^^ --- ^^^");

    listRouter.get('/', function(req, res) {
        res.json({ 
            status: 'OK', 
            app: appName, 
            version: version,
            route: route 
        });   
    });

    listRouter.get(`/${label}`, (req, res) => {
        res.json( list );   
    });
    
    listRouter.get(`/${label}/count`, (req, res) => {
        res.json( { count: list.length } );   
    });
    
    listRouter.get(`/${label}/:id`, (req, res) => {
        // convert from 1 based to 0 based array
        const id = parseInt(req.params.id) - 1;
        console.log(id);
        if( id < 0 || id >= list.length ) {
            res.status( 404 ).send(`id ${req.params.id} out of range [1 - ${list.length}]`);
        } else {
            res.json( list[id] );
        }   
    });

    return listRouter;

};