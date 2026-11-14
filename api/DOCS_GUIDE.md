# API style guide

When in doubt, copy `openapi/paths/meta.yaml` and start from there. You can treat it as the reference example.

## Main Conventions
1. The files in `openapi/` are to be taken as the source of truth. The backend and frontend
   follow them, and NOT the other way around. If you want to change the behaviour, first update
   the api contract, then regenerate the zod objects and TS types, and then only update the code.
2. Every endpoint includes which URD requirements it references (using a `x-urd` tag). Try to keep it
   as organised as possible, include at least the main ones.
3. Add a description only if the behaviour isn't obvious from the name. Otherwise just keep it simple.
4. The url endpoints use `kebab-case`, and the JSON fields use plural `camelCase`.
5. Keep bodies as objects at all times, that way it's easy to add data onto it without changing the whole
   endpoint's format and code.

## Structure
```
api/
  openapi/
    openapi.yaml                  
    paths/                        one file per URL path
    components/
      schemas/<area>/<Name>.yaml  one schema per file
      responses/<Name>.yaml       reusable responses (mostly errors)
      parameters/<Name>.yaml      reusable parameters
  STYLE_GUIDE.md
shared/api/generated/*            generated Zod and inferred TS types (do always commit it after a change)
dist/                             bundled specification and the generated docs.html
```

- **Path files** are named after the path, with `/` replaced by `-` and the braces removed. So for example,
  `/meta` is `meta.yaml`, `/participants/{participantId}/burden` is `participants-participantId-burden.yaml`.
  Path files hold all methods for that url (ie. both `post` and `get`).
- **Schema files** are named exactly like the schema (`Meta.yaml` defines `Meta`). Keep names unique,
  because the bundler uses the file name as the schema name.
- The bundler only collects whatever the paths reference. So a schema that nothing references is invisible to
  lint, docs and the generated types. Hence, do not add schemas "for later".

## Adding an endpoint
1. Find the requirements and the use case in the URD that the operation serves.
2. Copy `openapi/paths/meta.yaml` to a new path file and edit it. Set `operationId`, `tags` (exactly one), `summary`, `x-urd` and every response the caller can get.
3. Add the path to `paths:` in `openapi/openapi.yaml`. Add the tag there too if it is new.
4. Add one file per new schema under `components/schemas/<area>/`.
5. Run `npm run lint`. Fix what needs fixing (we have automatic format detection for SOME of it, but not all)
6. Run `npm run generate` and commit `shared/api/generated/*` together with the contract change.
7. Please ask for a review by at least one other member when making the pull request, preferably from the opposing
  team (ie. backend asks frontend and vice versa)

## Commands
| `npm run lint` | Checks the contract with Redocly CLI and the rules in `redocly.yaml` |
| `npm run bundle` | Merges all files into one: `dist/openapi.yaml` |
| `npm run docs` | Builds the rendered documentation into `dist/docs.html` |
| `npm run zod` | Generates zod and TS types in `shared/api/generated/*` |
| `npm run generate` | Lint, then types. PLEASE always run this before every commit |

## Methods
- `GET` for endpoints that don't need a body.
- `POST` for endpoints that need a body.
- `POST` for endpoints that create something or trigger some action.
- `DELETE` for removing.
- Note that we don't need `PUT` or `PATCH` since nothing in the dashboard should edit stored data.

## Useful Status Codes
Incldued for convinience's sake, but do actually read up on it if you are to change the specification.

| 200 | Successful read or action with a body |
| 201 | Something was created (ie. `POST /imports`) |
| 204 | Success without a body (ie. `DELETE`) |
| 400 | The request cannot be understood (ie. invalid JSON, wrong types, missing or unknown members) |
| 404 | Something that does not exist was requested |
| 413 | The request's payload is too large (ie. file uploads) |
| 415 | Unsupported format (ie. not importing a CSV) |
| 422 | Server understood the request but it failed some sort of validation (ie. could be in the data provided) |
| 503 | Service unavailable |

## Errors
Every 4xx and 5xx response has the media type `application/problem+json` and the `Problem` schema.
Clients use the provided `type` to know, and they DO NOT parse `title` or `detail` for that.
We define each reusable error once in `components/responses/` and reference it when needed.
Avoid writing error responses that carry heavy descriptions and examples beyond the short required text.

## References for this setup
We borrowed from the following industry standards the parts that kept things well structured and simpler.
Anything that made it too convoluted or complex beyond our needs was ommitted.

- **Redocly** (and it's multi-file layout) (ie. `openapi/` with `paths/` and `components/`, one `redocly.yaml`). It
  helps keep pull requests relatively small and avoids merge conflicts in one giant file.
- **GitHub's REST API**: They define errors once as named responses and referenced them
  at the endpoints. They also use a project-specific extension (in their case `x-github`) that every endpoint carries, which we followed albeit in more simply with the use of `x-urd`.
- **The Train Travel API** (it's a modern OpenAPI 3.1 example that was quite useful to get inspiration from).
  They follow specific error formats, and use pagination information in the JSON body next to the data.

We have a relatively simpler project, so beyond structural elements the rest was kept as easy to understand as
we could.