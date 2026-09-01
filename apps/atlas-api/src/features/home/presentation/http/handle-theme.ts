import type { RuntimeContext } from "../../../../core/runtime-context";
import type { Telemetry } from "../../../telemetry/application/ports/telemetry";
import { fw } from "../../../../fireweave/fw-harness";
import { pickTheme } from "../../application/pick-theme";

export async function handleTheme(
  ctx: RuntimeContext,
  telemetry: Telemetry,
  targetingKey: string,
): Promise<Response> {
  const started = performance.now();
  // @fireweave-controlpoint random-theme
  const enabled = await fw.controlPoints.getBooleanValue("random-theme", false, {
    targetingKey,
  });
  if (!enabled) {
    return Response.json({ error: "theme off", service: ctx.service }, { status: 404 });
  }
  const theme = pickTheme();
  telemetry.increment("random-theme.served", { theme: theme.name });
  telemetry.record("random-theme.latency_ms", performance.now() - started);
  return Response.json({ service: ctx.service, theme });
}
