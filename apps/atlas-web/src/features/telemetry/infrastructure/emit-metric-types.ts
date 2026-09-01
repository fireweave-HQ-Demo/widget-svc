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

async function postOtlp(endpoint: string, body: unknown): Promise<void> {
  await fetch(`${endpoint}/v1/metrics`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

/** Emit every OTLP metric instrument type from the browser. */
export async function emitAllMetricTypes(ctx: RuntimeContext): Promise<string[]> {
  const endpoint = ctx.exporterEndpoint.replace(/\/$/, "");
  if (!endpoint) return [];

  const now = nanoNow();
  const resource = { attributes: resourceAttrs(ctx) };
  const metrics = [
    {
      name: "feature.metric-types.counter",
      sum: {
        aggregationTemporality: 2,
        isMonotonic: true,
        dataPoints: [{ asInt: "1", startTimeUnixNano: now, timeUnixNano: now }],
      },
    },
    {
      name: "feature.metric-types.updown",
      sum: {
        aggregationTemporality: 2,
        isMonotonic: false,
        dataPoints: [{ asInt: "1", startTimeUnixNano: now, timeUnixNano: now }],
      },
    },
    {
      name: "feature.metric-types.gauge",
      gauge: { dataPoints: [{ asDouble: 42, timeUnixNano: now }] },
    },
    {
      name: "feature.metric-types.histogram",
      histogram: {
        aggregationTemporality: 2,
        dataPoints: [{ count: "1", sum: 12.5, timeUnixNano: now }],
      },
    },
    {
      name: "feature.metric-types.exponential_histogram",
      exponentialHistogram: {
        aggregationTemporality: 2,
        dataPoints: [
          {
            count: "1",
            sum: 12.5,
            scale: 3,
            zeroCount: "0",
            positive: { offset: 0, bucketCounts: ["1"] },
            negative: { offset: 0, bucketCounts: [] },
            timeUnixNano: now,
          },
        ],
      },
    },
    {
      name: "feature.metric-types.adopted",
      sum: {
        aggregationTemporality: 2,
        isMonotonic: true,
        dataPoints: [{ asInt: "1", startTimeUnixNano: now, timeUnixNano: now }],
      },
    },
  ];

  try {
    await postOtlp(endpoint, {
      resourceMetrics: [{ resource, scopeMetrics: [{ metrics }] }],
    });
  } catch {
    /* collector may reject CORS — page still works */
  }

  return metrics.map((m) => m.name);
}
