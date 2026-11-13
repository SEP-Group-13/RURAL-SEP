import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: {
      target: "../dist/openapi.yaml",
    },
    output: {
      client: "zod",
      mode: "single",
      target: "../shared/api/generated/orval/openapi.ts",
      override: {
        zod: {
          version: 4,
          generateReusableSchemas: true,
        },
      },
    },
  },
});
