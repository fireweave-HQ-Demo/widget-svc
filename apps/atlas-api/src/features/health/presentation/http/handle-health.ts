import type { RuntimeContext } from "../../../core/runtime-context";
import { getHealth } from "../../application/get-health";
import type { Telemetry } from "../../telemetry/application/ports/telemetry";

export function handleHealth(
  ctx: RuntimeContext,
  telemetry: Telemetry,
): Response {
  return Response.json(getHealth(ctx, telemetry.exporterStatus));
}
