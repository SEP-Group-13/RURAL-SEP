import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

/**
 * With VITE_MOCK_API=true (client/.env.development), /api/v1 is answered in the browser by the
 * API mock in app/mocks. The dynamic import keeps the mock out of the production bundle.
 */
async function startApiMockIfEnabled(): Promise<void> {
  if (import.meta.env.VITE_MOCK_API !== "true") {
    return;
  }
  const { startApiMock } = await import("./mocks/browser");
  await startApiMock();
}

startApiMockIfEnabled().then(() => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <HydratedRouter />
      </StrictMode>,
    );
  });
});
