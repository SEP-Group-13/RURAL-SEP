/**
 * Zod validators for the URL parameters (path and query) of every endpoint, built from the OpenAPI spec.
 * Request bodies are validated by spec.validator.ts.
 * Usage: params.searchParticipants.query.safeParse(req.query), params.getParticipant.path.safeParse(req.params)
 */

import { z } from 'zod'
import type { operations } from '@shared/api/generated/api.js'
import spec from '@shared/api/generated/openapi.json' with { type: 'json' }

// How a parameter, an endpoint and a URL path look in the spec JSON
type Parameter = { name: string; in: string; required?: boolean; schema: z.core.JSONSchema.JSONSchema }
type Operation = { operationId: string; parameters?: (Parameter | { $ref: string })[] }
type PathItem = { parameters?: (Parameter | { $ref: string })[] } & Record<string, Operation>

// A parameter is either written in place, or a reference to components.parameters (like ParticipantId)
function resolve(p: Parameter | { $ref: string }): Parameter {
  if (!('$ref' in p)) return p
  const name = p.$ref.replace('#/components/parameters/', '') as keyof typeof spec.components.parameters
  return spec.components.parameters[name] as Parameter
}

// One parameter into one validator
function toZod(p: Parameter): z.ZodType {
  let schema: z.ZodType = z.fromJSONSchema(p.schema)
  if (p.schema.type === 'integer' || p.schema.type === 'number') {
    schema = z.preprocess(v => (v === undefined ? v : Number(v)), schema)
  }
  // A parameter with a default can be left out, the default fills it in
  return p.required || p.schema.default !== undefined ? schema : schema.optional()
}

// All parameters of one location (path or query) as one object; unknown parameters are rejected
function objectFor(list: Parameter[], location: 'path' | 'query') {
  return z.strictObject(Object.fromEntries(list.filter(p => p.in === location).map(p => [p.name, toZod(p)])))
}

type Params<K extends keyof operations> = operations[K]['parameters']

// Every endpoint gets a path and a query validator, keyed by its operationId
const built: Record<string, { path: z.ZodType; query: z.ZodType }> = {}
for (const item of Object.values(spec.paths) as unknown as PathItem[]) {
  for (const [method, op] of Object.entries(item)) {
    // `parameters` is not a method: it holds the parameters shared by every method of this path
    if (method === 'parameters') continue
    const list = [...(item.parameters ?? []), ...((op as Operation).parameters ?? [])].map(resolve)
    built[(op as Operation).operationId] = { path: objectFor(list, 'path'), query: objectFor(list, 'query') }
  }
}

// The cast gives every validator its generated type, so parsed parameters are typed
export const params = built as {
  [K in keyof operations]: {
    path: z.ZodType<NonNullable<Params<K>['path']>>
    query: z.ZodType<NonNullable<Params<K>['query']>>
  }
}