import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    //forward API calls to Express backend, so the browser sees a single origin
    proxy: {
      "/api": "http://127.0.0.1:3000"
    },

  },
});
