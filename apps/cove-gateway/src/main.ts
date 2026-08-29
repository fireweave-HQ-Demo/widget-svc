import { serve } from "bun";
import { bootstrap } from "./composition/bootstrap";
import { createFetch } from "./composition/create-fetch";

/** Entrypoint — composition only. */
const { ctx, telemetry, port, identity } = bootstrap(3100);

serve({
  port,
  fetch: createFetch(ctx, telemetry, identity),
});

console.log(`cove-gateway listening on :${port} APP_ENV=${ctx.environment}`);

process.on("SIGINT", () => {
  void telemetry.shutdown().then(() => process.exit(0));
});
