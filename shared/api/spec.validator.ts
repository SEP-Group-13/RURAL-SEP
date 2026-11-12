// Zod validators built from the OpenAPI spec, so requests are checked against the spec's rules at runtime
// Usage: schemas.QueryParticipantsRequest.safeParse(req.body)

import { z } from 'zod'
import type { components } from '@shared/api/generated/api.js'
import spec from '@shared/api/generated/openapi.json' with { type: 'json' }

const defs = JSON.parse(
  JSON.stringify(spec.components.schemas).replaceAll('#/components/schemas/', '#/$defs/')
)

// fromJSONSchema can't handle RangeFilter's anyOf of only "required", rewrite it as two full objects
const { anyOf, ...rangeFilter } = defs.RangeFilter
defs.RangeFilter = {
  title: rangeFilter.title,
  anyOf: anyOf.map((branch: { required: string[] }) => ({
    ...rangeFilter,
    required: [...rangeFilter.required, ...branch.required],
  })),
}

type Schemas = components['schemas']

// Converts one schema of the spec into a Zod validator.
function build<K extends keyof Schemas>(name: K) {
  return z.fromJSONSchema({ $ref: `#/$defs/${name}`, $defs: defs }) as z.ZodType<Schemas[K]>
}

// One validator per schema in the spec, keyed by schema name (schemas.View, schemas.Filter)
export const schemas = Object.fromEntries(
  Object.keys(defs).map(name => [name, build(name as keyof Schemas)])
) as { [K in keyof Schemas]: z.ZodType<Schemas[K]> }
