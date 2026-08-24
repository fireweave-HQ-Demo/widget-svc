import type { Telemetry } from "../../../telemetry/application/ports/telemetry";
import { getMoodChip } from "../../application/get-mood-chip";

export async function handleMoodChip(telemetry: Telemetry): Promise<Response> {
  try {
    const body = await getMoodChip();
    if (!body) {
      return new Response(JSON.stringify({ mood: null }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    telemetry.increment("feature.mood-chip.adopted");
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  } catch {
    telemetry.increment("feature.mood-chip.error");
    return new Response(JSON.stringify({ error: "mood-chip-failed" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
}
