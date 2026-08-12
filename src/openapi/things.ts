import { OpenApiFragmentFactory } from './types';
import { schemaName, itemSchema, listExample } from './schema';

// Documents the collection routes served by static-list-router. Every path and
// name is derived from the live data file: a file declaring path '/v2' and
// label 'pets' produces /v2, /v2/pets, /v2/pets/count and /v2/pets/{id}.
// BASE_PATH is expressed through the spec's `servers` entry, not baked in here.
const thingsFragment: OpenApiFragmentFactory = (routes) => {
    const { path, label, list } = routes;
    const name = schemaName(label);
    const ref = `#/components/schemas/${name}`;

    return {
        components: {
            schemas: {
                [name]: itemSchema(routes),
            },
        },
        paths: {
            [path]: {
                get: {
                    summary: `Get the ${label} route status`,
                    tags: [label],
                    responses: {
                        200: {
                            description: `${label} route status`,
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        example: {
                                            status: 'OK',
                                            app: 'thing-server',
                                            version: '1.0.0',
                                            path,
                                        },
                                    },
                                },
                            },
                        },
                        500: {
                            description: 'Internal server error',
                        },
                    },
                },
            },
            [`${path}/${label}`]: {
                get: {
                    summary: `Get an array of ${label}`,
                    tags: [label],
                    responses: {
                        200: {
                            description: `An array of ${label}.`,
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'array',
                                        items: { $ref: ref },
                                        example: listExample(routes),
                                    },
                                },
                            },
                        },
                        500: {
                            description: 'Internal server error',
                        },
                    },
                },
            },
            [`${path}/${label}/count`]: {
                get: {
                    summary: `Get the count of ${label}`,
                    tags: [label],
                    responses: {
                        200: {
                            description: `The number of ${label}.`,
                            content: {
                                'application/json': {
                                    schema: {
                                        type: 'object',
                                        properties: {
                                            count: { type: 'integer' },
                                        },
                                        example: { count: list.length },
                                    },
                                },
                            },
                        },
                        500: {
                            description: 'Internal server error',
                        },
                    },
                },
            },
            [`${path}/${label}/{id}`]: {
                get: {
                    summary: `Get one of the ${label} by its 1-based id`,
                    parameters: [
                        {
                            in: 'path',
                            name: 'id',
                            schema: { type: 'integer' },
                            required: true,
                            description: `1-based index of the entry in the ${label} list`,
                        },
                    ],
                    tags: [label],
                    responses: {
                        200: {
                            description: 'The entry at the given position.',
                            content: {
                                'application/json': {
                                    schema: { $ref: ref },
                                    example: list[0],
                                },
                            },
                        },
                        404: {
                            description: 'id out of range',
                        },
                        500: {
                            description: 'Internal server error',
                        },
                    },
                },
            },
        },
    };
};

export default thingsFragment;
