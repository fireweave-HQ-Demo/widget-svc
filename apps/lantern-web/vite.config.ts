import { defineConfig, type Plugin } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { loadRuntimeFromEnv } from "./src/features/runtime/infrastructure/env-runtime";
import { getHealth } from "./src/features/health/application/get-health";

const framework = "svelte";

function healthPlugin(): Plugin {
  return {
    name: "bench-health",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] === "/health") {
          const ctx = loadRuntimeFromEnv("lantern-web", framework);
          const body = JSON.stringify(getHealth(ctx));
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(body);
          return;
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] === "/health") {
          const ctx = loadRuntimeFromEnv("lantern-web", framework);
          const body = JSON.stringify(getHealth(ctx));
          res.statusCode = 200;
          res.setHeader("content-type", "application/json");
          res.end(body);
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [svelte(), healthPlugin()],
  server: { host: true, port: 5173, strictPort: true, allowedHosts: true },
  preview: { host: true, port: 5173, strictPort: true, allowedHosts: true },
  build: { target: "es2022" },
});
