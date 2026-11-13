import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: {
      target: "../dist/openapi.yaml",
    },
    output: {
      client: "zod",
      target: "../shared/api/generated/api.zod.ts",
      schemas: {
        path: "../shared/api/generated/schemas",
        type: "zod",
        mode: "split",
      },
      override: {
        zod: {
          version: 4,
          generateReusableSchemas: true,
        	generateCompanionTypes: true
        },
      },
    },
  },
});
