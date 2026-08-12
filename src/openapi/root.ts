import { OpenApiFragmentFactory } from './types';

// Documents the service status route mounted at BASE_PATH. The example echoes
// the live label, path and count so it matches what the route actually returns.
const rootFragment: OpenApiFragmentFactory = ({ path, label, list }) => ({
    paths: {
        '/': {
            get: {
                summary: 'Get the service status',
                tags: ['service health'],
                responses: {
                    200: {
                        description: 'Service status',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    example: {
                                        status: 'OK',
                                        app: 'thing-server',
                                        version: '1.0.0',
                                        uptime: '00:00:31',
                                        route: '/',
                                        explorer: '/api-docs',
                                        meta: {
                                            label,
                                            path,
                                            count: list.length,
                                        },
                                    },
                                },
                            },
                        },
                    },
                    500: {
                        description: 'Internal service error',
                    },
                },
            },
        },
    },
});

export default rootFragment;
