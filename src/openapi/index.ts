import {
    OpenApiDefinition,
    OpenApiFragmentFactory,
    OpenApiSpec,
    RouteInfo,
} from './types';
import rootFragment from './root';
import thingsFragment from './things';

// The route fragments that make up the served spec.
// Put future route specs here.
const fragments: OpenApiFragmentFactory[] = [
    rootFragment,
    thingsFragment,
];

// Combine the base definition (title, version, servers) with the route
// fragments into a single OpenAPI document for swagger-ui-express. This is the
// job swagger-jsdoc used to do; it was dropped because it pulled a full
// OpenAPI validator (ajv, js-yaml, fast-uri) in to serve a docs page.
//
// `routes` describes the collection actually being served, so the generated
// paths, tags and examples track the data file instead of hardcoding /v1 and
// 'things'.
//
// Fragments are expected to own disjoint paths and schema names; a later
// fragment declaring the same key as an earlier one wins.
export const buildSpec = (
    definition: OpenApiDefinition,
    routes: RouteInfo,
): OpenApiSpec => {
    const spec: OpenApiSpec = {
        ...definition,
        paths: {},
        components: { schemas: {} },
    };

    for (const fragment of fragments) {
        const { paths, components } = fragment(routes);
        Object.assign(spec.paths, paths);
        const { schemas, ...rest } = components || {};
        Object.assign(spec.components, rest);
        Object.assign(spec.components.schemas, schemas);
    }

    return spec;
};

export default buildSpec;
