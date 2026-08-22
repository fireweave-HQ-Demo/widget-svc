import type { RuntimeContext } from "../../../core/runtime-context";

/** Lightweight browser span via OTLP HTTP — no Fireweave SDK. */
export async function startBrowserOtel(ctx: RuntimeContext): Promise<void> {
  const endpoint = ctx.exporterEndpoint.replace(/\/$/, "");
  if (!endpoint) return;
  try {
    const now = Date.now();
    const tid = [...crypto.getRandomValues(new Uint8Array(16))]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const sid = [...crypto.getRandomValues(new Uint8Array(8))]
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    await fetch(`${endpoint}/v1/traces`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        resourceSpans: [
          {
            resource: {
              attributes: [
                { key: "service.name", value: { stringValue: ctx.service } },
                { key: "deployment.environment", value: { stringValue: ctx.environment } },
              ],
            },
            scopeSpans: [
              {
                spans: [
                  {
                    traceId: tid,
                    spanId: sid,
                    name: "document.load",
                    kind: 1,
                    startTimeUnixNano: String(now * 1e6),
                    endTimeUnixNano: String((now + 5) * 1e6),
                    status: { code: 1 },
                  },
                ],
              },
            ],
          },
        ],
      }),
    });
  } catch {
    /* collector may reject CORS in some profiles — page still works */
  }
}
