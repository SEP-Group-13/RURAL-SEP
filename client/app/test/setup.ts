/**
 * Vitest setup, run before each test file.
 *
 * The API client uses relative URLs (`/api/v1/...`). A browser resolves them against the page;
 * Node's Request rejects them. This Request resolves them against a fake origin instead.
 */
const NodeRequest = globalThis.Request

class BrowserLikeRequest extends NodeRequest {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(typeof input === 'string' ? new URL(input, 'http://localhost') : input, init)
  }
}

globalThis.Request = BrowserLikeRequest
