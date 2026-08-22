import { createServer } from "node:http";
import { bootstrap } from "./composition/bootstrap";
import { createFetch } from "./composition/create-fetch";

/** Entrypoint — composition only. */
const { ctx, telemetry, port } = bootstrap(3000);
const fetchHandler = createFetch(ctx, telemetry);

createServer(async (req, res) => {
  const host = req.headers.host ?? "127.0.0.1";
  const url = `http://${host}${req.url ?? "/"}`;
  const request = new Request(url, { method: req.method });
  const response = await fetchHandler(request);
  res.statusCode = response.status;
  response.headers.forEach((v, k) => res.setHeader(k, v));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(port, "0.0.0.0", () => {
  console.log(`harbor-api listening on :${port} APP_ENV=${ctx.environment}`);
});

process.on("SIGINT", () => {
  void telemetry.shutdown().then(() => process.exit(0));
});
