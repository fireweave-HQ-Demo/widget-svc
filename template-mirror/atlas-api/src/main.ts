import { serve } from "bun";
import { bootstrap } from "./composition/bootstrap";
import { createFetch } from "./composition/create-fetch";
import { initFwHarness } from "./fireweave/fw-harness";

await initFwHarness();

/** Entrypoint — composition only. */
const { ctx, telemetry, port, identity } = bootstrap(3000);

serve({
  port,
  fetch: createFetch(ctx, telemetry, identity),
});

console.log(`atlas-api listening on :${port} APP_ENV=${ctx.environment}`);

process.on("SIGINT", () => {
  void telemetry.shutdown().then(() => process.exit(0));
});
