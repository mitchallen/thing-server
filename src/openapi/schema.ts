import { RouteInfo } from './types';

// Helpers for describing the served collection from the data itself, so the
// docs stay correct for any data file rather than only the default one.

// Component keys must match ^[a-zA-Z0-9._-]+$, so strip anything else out.
// A single trailing 's' is dropped so 'things' documents a 'Thing' — a display
// nicety, not real singularisation ('species' would become 'Specie'). It only
// ever affects the schema's name, never a route or a property.
export const schemaName = (label: string): string => {
    const cleaned = label.replace(/[^a-zA-Z0-9._-]/g, '');
    const singular = cleaned.endsWith('s') ? cleaned.slice(0, -1) : cleaned;
    if (!singular) {
        return 'Item';
    }
    return singular.charAt(0).toUpperCase() + singular.slice(1);
};

// Map a sample value to an OpenAPI type. `null` yields an empty schema, which
// is OpenAPI's "any", since one null sample says nothing about the property.
const typeOf = (value: unknown): { type?: string } => {
    if (value === null) {
        return {};
    }
    if (Array.isArray(value)) {
        return { type: 'array' };
    }
    switch (typeof value) {
        case 'string':  return { type: 'string' };
        case 'boolean': return { type: 'boolean' };
        case 'number':  return { type: Number.isInteger(value) ? 'integer' : 'number' };
        case 'object':  return { type: 'object' };
        default:        return {};
    }
};

// Reconcile the types seen for one property across every item. Widen an
// integer/number mix to number; anything genuinely conflicting (a key that is
// a string in one entry and an object in another) drops to an empty schema
// rather than asserting a type that some entries would violate.
const widen = (types: { type?: string }[]): { type?: string } => {
    const seen = new Set(types.map((t) => t.type).filter((t): t is string => !!t));

    if (seen.size === 0) {
        return {};
    }
    if (seen.size === 1) {
        return { type: [...seen][0] };
    }
    if (seen.size === 2 && seen.has('integer') && seen.has('number')) {
        return { type: 'number' };
    }
    return {};
};

// Describe an item from the data itself. Every entry is inspected, not just
// the first, so a list whose later entries differ does not produce a schema
// they violate. Items are free-form — the router serves whatever the data file
// holds — so an empty list falls back to an unconstrained object rather than
// inventing properties.
export const itemSchema = (routes: RouteInfo): { [key: string]: unknown } => {
    const { list, label } = routes;
    const [sample] = list;

    if (!sample) {
        return {
            type: 'object',
            description: `An entry from the ${label} collection.`,
        };
    }

    // Union of keys across all entries, first-seen order.
    const keys: string[] = [];
    for (const item of list) {
        for (const key of Object.keys(item)) {
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }
    }

    const properties: { [key: string]: unknown } = {};
    for (const key of keys) {
        properties[key] = widen(
            list.filter((item) => key in item).map((item) => typeOf(item[key])),
        );
    }

    return {
        type: 'object',
        description: `An entry from the ${label} collection. Objects in the list may have any properties; these are the ones the current data set uses.`,
        properties,
        example: sample,
    };
};

// Up to three items, to keep the rendered example readable.
export const listExample = (routes: RouteInfo): unknown[] => routes.list.slice(0, 3);
