import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["server/src/app.ts"],
  outDir: "dist/server",
  format: ["esm"],
  target: "node20",
  sourcemap: true,
  clean: true,
  tsconfig: "server/tsconfig.json",
});