# Testing

How we write, name and place tests in RURAL-SEP. For the commands, see
[CONTRIBUTING](CONTRIBUTING.md#linting-formatting-and-tests).


## Where tests live

Tests sit **next to the file they test**, with the same name plus `.test`:

```
server/src/
├── routes/
│   ├── error.route.ts
│   └── error.route.test.ts        ← integration test for the route
└── utils/
    ├── httpResponses.ts
    └── httpResponses.test.ts      ← unit test for the helpers
client/app/
└── routes/
    ├── dashboard-layout.tsx
    └── dashboard-layout.test.tsx  ← integration test for the layout
```

- Vitest only picks up tests under `server/src/` (`*.test.ts`) and `client/app/`
  (`*.test.ts`, `*.test.tsx`). Tests anywhere else are not run.
- Client tests run in [jsdom](https://github.com/jsdom/jsdom), a fake browser page, so React
  components can be rendered with [Testing Library](https://testing-library.com/docs/react-testing-library/intro).
  Server tests run in plain Node.
- Use **`.test.ts`**, not `.spec.ts` or a `__tests__/` folder. Test files are excluded from the
  SEP code quality analysis by the `*.test.ts(x)` pattern (see the
  [README](README.md#excluded-from-code-quality-analysis)). Other names would be graded as source code.


## Test basics

### `describe`, `it`, `expect` and `vi`

These four are imported from `'vitest'` and make up every test.

**`describe` groups related tests**, usually one group per function or component. It does not
test anything itself; it organises tests and their output.

```ts
describe('notFound', () => {
  // all tests about notFound go here
})
```

**`it` is one test.** The first argument is a sentence saying what should happen; the function
is the test. If anything inside it throws or an `expect` fails, that test fails and the others
still run. (`test(...)` is the same thing under another name.)

```ts
it('sends a 404 problem+json response', () => {
  // arrange, act, assert
})
```

The output reads as `✓ notFound > sends a 404 problem+json response`.

**`expect` checks a value.** It wraps a value so you can make a claim about it with a
*matcher*. If the claim is false, the test fails and shows what was expected and what was received.

```ts
expect(res.status).toBe(404)                                  // exactly equal
expect(body).toEqual({ title: 'Not Found' })                  // same contents (objects, arrays)
expect(body).toMatchObject({ type: 'urn:problem:not-found' }) // contains at least these fields
expect(header).toContain('application/problem+json')          // string or array includes
expect(() => parse('x')).toThrow()                            // function throws
expect(mock.status).toHaveBeenCalledWith(404)                 // a fake was called with this
```

**`vi` makes fakes.** It replaces real things so a test stays isolated from the rest of the system.

```ts
const fn = vi.fn()              // a fake function that records every call
fn.mockReturnValue(42)          // ...and returns what you tell it
vi.spyOn(console, 'error')      // watch a real function without replacing it
vi.mock('@/utils/database.js')  // replace a whole module, e.g. so tests never touch the database
vi.useFakeTimers()              // control time: setTimeout, dates
```

### Arrange, act, assert

Every test has the same three steps, in this order, separated by blank lines:

1. **Arrange:** set up what the test needs: input data, fakes, a test server.
2. **Act:** do the one thing being tested, usually a single function call or request.
3. **Assert:** check the result with `expect`.

In this example, taken from the [unit test template](#unit-test-template), `notFound` is the real
function being tested (from `server/src/utils/httpResponses.ts`), and `fakeResponse` is a helper
defined in the test file that builds a fake Express `res` out of `vi.fn()`s.

```ts
it('sends a 404 problem+json response', () => {
  // Arrange: a fake response object to pass in
  const { res, mock } = fakeResponse()

  // Act: call the function under test, once
  notFound(res)

  // Assert: check what it did
  expect(mock.status).toHaveBeenCalledWith(404)
  expect(mock.type).toHaveBeenCalledWith('application/problem+json')
})
```

Keeping the steps separate makes a test easy to read: what is the situation, what happens, what
should be true afterwards. If a test needs several *acts*, it is usually testing several things
and should be split into several `it`s. The `// Arrange` / `// Act` / `// Assert` comments are
optional;.


## Unit test template

Tests one function in isolation.

`server/src/utils/httpResponses.test.ts`

```ts
import type { Response } from 'express-serve-static-core'
import { describe, expect, it, vi } from 'vitest'
import { badRequest, notFound } from '@/utils/httpResponses.js'

// Fake Express Response: every method records its call and returns the fake, so chained
// calls like res.status(404).type(...).json(...) work.
function fakeResponse() {
  const mock = { status: vi.fn(), type: vi.fn(), json: vi.fn(), send: vi.fn() }
  for (const fn of Object.values(mock)) fn.mockReturnValue(mock)
  return { res: mock as unknown as Response, mock }
}

describe('notFound', () => {
  it('sends a 404 problem+json response', () => {
    // Arrange
    const { res, mock } = fakeResponse()

    // Act
    notFound(res)

    // Assert
    expect(mock.status).toHaveBeenCalledWith(404)
    expect(mock.type).toHaveBeenCalledWith('application/problem+json')
    expect(mock.json).toHaveBeenCalledWith(expect.objectContaining({ title: 'Not Found' }))
  })
})

describe('badRequest', () => {
  it('puts the given detail in the body', () => {
    const { res, mock } = fakeResponse()

    badRequest(res, 'participantId must be a number')

    expect(mock.status).toHaveBeenCalledWith(400)
    expect(mock.json).toHaveBeenCalledWith(
      expect.objectContaining({ detail: 'participantId must be a number' }),
    )
  })
})
```

---

## Integration test templates

Integration tests check that several real parts work together.

### Backend
>TBA

### Frontend

Frontend integration tests render a real page or layout (for example the dashboard layout with
its sidebar, top bar and routing) and use it the way a user would: find things on screen, click,
and check what changed. No server is involved. We added these dev dependencies to `client/` for them:

| Library | What it does |
| --- | --- |
| [`jsdom`](https://github.com/jsdom/jsdom) | A fake browser page inside Node (`document`, `window`, elements, events). React needs it to render, because tests run in Node, not in a browser. Client tests use it via `environment: 'jsdom'` in `vitest.config.ts`. |
| [`@testing-library/react`](https://testing-library.com/docs/react-testing-library/intro) | Renders React components into that page (`render`) and finds elements the way a user sees them, by role and text (`screen.getByRole('link', { name: 'Visualization' })`). |
| [`@testing-library/dom`](https://testing-library.com/docs/dom-testing-library/intro) | The query functions `@testing-library/react` is built on. It is required by it but not installed automatically. |
| [`@testing-library/user-event`](https://testing-library.com/docs/user-event/intro) | Simulates real user actions: clicking, typing, tabbing. |

Pages that use routing (`NavLink`, `Link`, `Outlet`) also need `createRoutesStub` from
`react-router`, which is already a dependency.


## Conventions

- **One behaviour per `it`.** Name it as a sentence about what happens:
  `it('returns 404 when the participant does not exist')`, not `it('works')`.
- **Arrange, act, assert.** Set up, do one thing, check the result. Blank lines between the three.
- **Group by unit with `describe`**, usually one `describe` per exported function or component.
- **Import from `'vitest'`**: `describe`, `it`, `expect`, `vi`, `beforeAll`, `afterAll`.
- **Test behaviour, not implementation.** Check what a caller can see (return values, responses),
  not private details, so refactors don't break tests.
