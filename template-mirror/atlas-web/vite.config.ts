import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { loadRuntimeFromEnv } from "./src/features/runtime/infrastructure/env-runtime";
import { getHealth } from "./src/features/health/application/get-health";

const framework = "react";

function healthPlugin(): Plugin {
  return {
    name: "bench-health",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split("?")[0] === "/health") {
          const ctx = loadRuntimeFromEnv("atlas-web", framework);
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
          const ctx = loadRuntimeFromEnv("atlas-web", framework);
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
  plugins: [react(), healthPlugin()],
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 5173, strictPort: true },
});
