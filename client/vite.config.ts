import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
        tsconfigPaths: true,
        alias: {
            "@shared": fileURLToPath(new URL("../shared", import.meta.url)),
        },
    },
    server: {
        fs: { allow: [".", "../shared"] },
        proxy: {
            "/api": process.env.API_URL ?? "http://localhost:3000",
        },
    },
    preview: {
        host: "127.0.0.1",
    },
});
