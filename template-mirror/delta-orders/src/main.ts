import { serve } from "bun";
import { bootstrap } from "./composition/bootstrap";
import { createFetch } from "./composition/create-fetch";

/** Entrypoint — composition only. */
const { ctx, telemetry, port } = bootstrap(3101);

serve({
  port,
  fetch: createFetch(ctx, telemetry),
});

console.log(`delta-orders listening on :${port} APP_ENV=${ctx.environment}`);

process.on("SIGINT", () => {
  void telemetry.shutdown().then(() => process.exit(0));
});
