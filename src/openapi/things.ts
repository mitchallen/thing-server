import { OpenApiFragment } from './types';

// Documents the things routes served by static-list-router. The paths here are
// the defaults ('/v1'); BASE_PATH is expressed through the spec's `servers`
// entry rather than being baked into each path.
const thingsFragment: OpenApiFragment = {
    components: {
        schemas: {
            Thing: {
                type: 'object',
                description:
                    'A thing. Objects in the list may have any properties; the default data set uses title and value.\n',
                properties: {
                    title: {
                        type: 'string',
                        description: "The thing's title",
                    },
                    value: {
                        type: 'number',
                        description: "The thing's value",
                    },
                },
                example: {
                    title: 'alpha',
                    value: 100,
                },
            },
        },
    },
    paths: {
        '/v1': {
            get: {
                summary: 'Get the things route status',
                tags: ['things'],
                responses: {
                    200: {
                        description: 'Things route status',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    example: {
                                        status: 'OK',
                                        app: 'thing-server',
                                        version: '1.0.0',
                                        path: '/v1',
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
        '/v1/things': {
            get: {
                summary: 'Get an array of things',
                tags: ['things'],
                responses: {
                    200: {
                        description: 'An array of things.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/Thing',
                                    },
                                    example: [
                                        { title: 'alpha', value: 100 },
                                        { title: 'beta', value: 200 },
                                        { title: 'gamma', value: 300 },
                                    ],
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
        '/v1/things/count': {
            get: {
                summary: 'Get the count of things',
                tags: ['things'],
                responses: {
                    200: {
                        description: 'The number of things.',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        count: { type: 'integer' },
                                    },
                                    example: { count: 3 },
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
        '/v1/things/{id}': {
            get: {
                summary: 'Get a thing by its 1-based id',
                parameters: [
                    {
                        in: 'path',
                        name: 'id',
                        schema: { type: 'integer' },
                        required: true,
                        description: '1-based index of the thing in the list',
                    },
                ],
                tags: ['things'],
                responses: {
                    200: {
                        description: 'The thing at the given position.',
                        content: {
                            'application/json': {
                                schema: {
                                    $ref: '#/components/schemas/Thing',
                                },
                                example: {
                                    title: 'alpha',
                                    value: 100,
                                },
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

export default thingsFragment;
