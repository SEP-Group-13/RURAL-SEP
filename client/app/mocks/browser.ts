import { setupWorker } from 'msw/browser'
import { handlers, mockControls } from './handlers'

/**
 * Starts the API mock in the browser. Loaded by entry.client.tsx only when VITE_MOCK_API is 'true',
 * through a dynamic import, so none of the mock code is in the production bundle.
 */
export async function startApiMock(): Promise<void> {
  const worker = setupWorker(...handlers)
  // Requests the mock does not know (the app's own files, fonts) go to the network as usual.
  await worker.start({ onUnhandledFrame: 'bypass', quiet: true })
  Object.assign(window, { mockControls })
  console.info('API mock active: /api/v1 is answered in the browser. window.mockControls changes delay and failures.')
}
