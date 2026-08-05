import { Router, Request, Response } from 'express';

export interface StaticListRouterSpec {
    appName?: string;
    version?: string;
    label?: string;
    path?: string;
    list?: { [key: string]: any }[];
    port?: string | number;   // for console instructions
}

export const create = (spec: StaticListRouterSpec = {}) => {

    const {
        appName = 'app',
        version = '0.0.1',
        label = 'objects',
        path = '/api',
        list = [{ id: 1, title: "TODO" }],
        port = ''
    } = spec;

    const listRouter = Router();

    console.log("vvv --- EXAMPLES --- vvv");
    console.log(`curl http://localhost:${port}/`);
    console.log(`curl http://localhost:${port}${path}`);
    console.log(`curl http://localhost:${port}${path}/${label}`);
    console.log(`curl http://localhost:${port}${path}/${label}/count`);
    console.log(`curl http://localhost:${port}${path}/${label}/1`);
    console.log("^^ --- ^^^^^^^^ --- ^^^");

    listRouter.get('/', (req: Request, res: Response) => {
        res.json({
            status: 'OK',
            app: appName,
            version: version,
            path: path
        });
    });

    listRouter.get(`/${label}`, (req: Request, res: Response) => {
        res.json( list );
    });

    listRouter.get(`/${label}/count`, (req: Request, res: Response) => {
        res.json( { count: list.length } );
    });

    listRouter.get(`/${label}/:id`, (req: Request, res: Response) => {
        // convert from 1 based to 0 based array
        const id = parseInt(req.params.id as string, 10) - 1;
        if( id < 0 || id >= list.length ) {
            res.status( 404 ).send(`id ${req.params.id} out of range [1 - ${list.length}]`);
        } else {
            res.json( list[id] );
        }
    });

    return listRouter;

};

export default { create };
