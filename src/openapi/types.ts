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

// The live shape of the served collection. The spec is generated from this
// rather than hardcoded, so a data file that declares a different path or
// label produces docs that match the routes actually mounted.
export interface RouteInfo {
    // Route path relative to the server base — '/v1' by default. BASE_PATH is
    // carried by the spec's `servers` entry, so it must NOT be included here.
    path: string;
    // Collection name; forms the URL segment (`/v1/things`) and the tag.
    label: string;
    // The served items. Drives the schema properties and the doc examples.
    list: { [key: string]: unknown }[];
}

// Each fragment is a function of the live routes rather than a static object.
export type OpenApiFragmentFactory = (routes: RouteInfo) => OpenApiFragment;
