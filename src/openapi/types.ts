// Minimal structural types for the OpenAPI fragments in this directory.
// Deliberately loose: enough to catch a typo in a fragment's shape without
// taking on a dependency for the full OpenAPI 3 type surface.

export interface OpenApiFragment {
    paths?: { [path: string]: unknown };
    components?: {
        schemas?: { [name: string]: unknown };
        [key: string]: unknown;
    };
    [key: string]: unknown;
}

export interface OpenApiDefinition {
    openapi: string;
    info: { [key: string]: unknown };
    servers?: { [key: string]: unknown }[];
    [key: string]: unknown;
}

export interface OpenApiSpec extends OpenApiDefinition {
    paths: { [path: string]: unknown };
    components: {
        schemas: { [name: string]: unknown };
        [key: string]: unknown;
    };
}
