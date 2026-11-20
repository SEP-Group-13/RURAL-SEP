import { setupServer } from 'msw/node'
import { handlers } from './handlers'

/** The API mock for vitest: `server.listen()` in beforeAll, `server.close()` in afterAll. */
export const server = setupServer(...handlers)
