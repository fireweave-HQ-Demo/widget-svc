import type { RuntimeContext } from "../../../core/runtime-context";

function nanoNow(): string {
  return String(Date.now() * 1e6);
}

function resourceAttrs(ctx: RuntimeContext) {
  return [
    { key: "service.name", value: { stringValue: ctx.service } },
    { key: "deployment.environment", value: { stringValue: ctx.environment } },
  ];
}

async function postOtlp(endpoint: string, path: string, body: unknown): Promise<void> {
  await fetch(`${endpoint}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Named counter — FireWeave wrap points call `increment("feature.*.adopted")`. */
export async function increment(
  ctx: RuntimeContext,
  name: string,
  value = 1,
): Promise<void> {
  const endpoint = ctx.exporterEndpoint.replace(/\/$/, "");
  if (!endpoint) return;
  const now = nanoNow();
  try {
    await postOtlp(endpoint, "/v1/metrics", {
      resourceMetrics: [
        {
          resource: { attributes: resourceAttrs(ctx) },
          scopeMetrics: [
            {
              metrics: [
                {
                  name,
                  sum: {
                    aggregationTemporality: 2,
                    isMonotonic: true,
                    dataPoints: [
                      {
                        asInt: String(value),
                        startTimeUnixNano: now,
                        timeUnixNano: now,
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    });
  } catch {
    /* collector may reject CORS — page still works */
  }
}

/** Named histogram — FireWeave wrap points call `record("feature.*.latency", ms)`. */
export async function record(
  ctx: RuntimeContext,
  name: string,
  value: number,
): Promise<void> {
  const endpoint = ctx.exporterEndpoint.replace(/\/$/, "");
  if (!endpoint) return;
  const now = nanoNow();
  try {
    await postOtlp(endpoint, "/v1/metrics", {
      resourceMetrics: [
        {
          resource: { attributes: resourceAttrs(ctx) },
          scopeMetrics: [
            {
              metrics: [
                {
                  name,
                  histogram: {
                    aggregationTemporality: 2,
                    dataPoints: [
                      {
                        count: "1",
                        sum: value,
                        timeUnixNano: now,
                      },
                    ],
                  },
                },
              ],
            },
          ],
        },
      ],
    });
  } catch {
    /* collector may reject CORS — page still works */
  }
}

/** Lightweight browser traces + metrics via OTLP HTTP — no Fireweave SDK. */
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
    await postOtlp(endpoint, "/v1/traces", {
      resourceSpans: [
        {
          resource: { attributes: resourceAttrs(ctx) },
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
    });
    await increment(ctx, "document.load");
  } catch {
    /* collector may reject CORS in some profiles — page still works */
  }
}
