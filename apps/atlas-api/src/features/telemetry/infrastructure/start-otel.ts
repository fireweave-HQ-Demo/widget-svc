import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import {
  metrics,
  trace,
  SpanStatusCode,
  type Counter,
  type Histogram,
  type Tracer,
  type UpDownCounter,
  type Gauge,
} from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BatchSpanProcessor,
  BasicTracerProvider,
} from "@opentelemetry/sdk-trace-base";
import {
  BatchLogRecordProcessor,
  LoggerProvider,
} from "@opentelemetry/sdk-logs";
import {
  MeterProvider,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_NAMESPACE,
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
} from "@opentelemetry/semantic-conventions";
import type { RuntimeContext } from "../../../core/runtime-context";
import type { Telemetry } from "../application/ports/telemetry";

/**
 * Infrastructure: traces + logs + metrics → OTLP HTTP collector.
 * Metrics export to `/v1/metrics` so FireWeave named signals
 * (`increment` / `record`) are real OTLP counters/histograms.
 */
export function startOtel(ctx: RuntimeContext): Telemetry {
  const base = ctx.exporterEndpoint.replace(/\/$/, "");
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: ctx.service,
    [ATTR_SERVICE_NAMESPACE]:
      Bun.env.OTEL_SERVICE_NAMESPACE ??
      parseResourceAttr("service.namespace") ??
      "bench",
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: ctx.environment,
  });

  let exporterStatus: "healthy" | "degraded" = "healthy";

  const traceExporter = new OTLPTraceExporter({
    url: `${base}/v1/traces`,
  });
  const tracerProvider = new BasicTracerProvider({
    resource,
    spanProcessors: [new BatchSpanProcessor(traceExporter)],
  });
  trace.setGlobalTracerProvider(tracerProvider);
  const tracer: Tracer = trace.getTracer(ctx.service, "0.1.0");

  const logExporter = new OTLPLogExporter({
    url: `${base}/v1/logs`,
  });
  const loggerProvider = new LoggerProvider({
    resource,
    processors: [new BatchLogRecordProcessor(logExporter)],
  });
  logs.setGlobalLoggerProvider(loggerProvider);
  const logger = logs.getLogger(ctx.service);

  const metricExporter = new OTLPMetricExporter({
    url: `${base}/v1/metrics`,
  });
  const meterProvider = new MeterProvider({
    resource,
    readers: [
      new PeriodicExportingMetricReader({
        exporter: metricExporter,
        exportIntervalMillis: 5_000,
      }),
    ],
  });
  metrics.setGlobalMeterProvider(meterProvider);
  const meter = meterProvider.getMeter(ctx.service, "0.1.0");
  const counters = new Map<string, Counter>();
  const histograms = new Map<string, Histogram>();
  const gauges = new Map<string, Gauge>();
  const upDownCounters = new Map<string, UpDownCounter>();

  const telemetry: Telemetry = {
    get exporterStatus() {
      return exporterStatus;
    },
    info(message, attributes = {}) {
      logger.emit({
        severityNumber: SeverityNumber.INFO,
        severityText: "INFO",
        body: message,
        attributes,
      });
    },
    increment(name, attributes = {}) {
      let counter = counters.get(name);
      if (!counter) {
        counter = meter.createCounter(name);
        counters.set(name, counter);
      }
      counter.add(1, attributes);
    },
    record(name, value, attributes = {}) {
      let histogram = histograms.get(name);
      if (!histogram) {
        histogram = meter.createHistogram(name);
        histograms.set(name, histogram);
      }
      histogram.record(value, attributes);
    },
    setGauge(name, value, attributes = {}) {
      let gauge = gauges.get(name);
      if (!gauge) {
        gauge = meter.createGauge(name);
        gauges.set(name, gauge);
      }
      gauge.record(value, attributes);
    },
    addUpDown(name, delta, attributes = {}) {
      let upDown = upDownCounters.get(name);
      if (!upDown) {
        upDown = meter.createUpDownCounter(name);
        upDownCounters.set(name, upDown);
      }
      upDown.add(delta, attributes);
    },
    async emitExponentialHistogram(name, value, attributes = {}) {
      const now = String(Date.now() * 1e6);
      const attrList = Object.entries(attributes).map(([key, val]) => ({
        key,
        value: { stringValue: val },
      }));
      const body = {
        resourceMetrics: [
          {
            resource: {
              attributes: [
                { key: ATTR_SERVICE_NAME, value: { stringValue: ctx.service } },
                {
                  key: ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
                  value: { stringValue: ctx.environment },
                },
              ],
            },
            scopeMetrics: [
              {
                metrics: [
                  {
                    name,
                    exponentialHistogram: {
                      aggregationTemporality: 2,
                      dataPoints: [
                        {
                          count: "1",
                          sum: value,
                          scale: 0,
                          zeroCount: "0",
                          positive: { offset: 0, bucketCounts: ["1"] },
                          negative: { offset: 0, bucketCounts: [] },
                          startTimeUnixNano: now,
                          timeUnixNano: now,
                          attributes: attrList,
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      };
      await fetch(`${base}/v1/metrics`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    async withRequestSpan(req, handle) {
      const url = new URL(req.url);
      return tracer.startActiveSpan(
        `${req.method} ${url.pathname}`,
        {
          attributes: {
            "http.request.method": req.method,
            "url.path": url.pathname,
            "service.name": ctx.service,
          },
        },
        async (span) => {
          try {
            const res = await handle();
            span.setAttribute("http.response.status_code", res.status);
            if (res.status >= 500) {
              span.setStatus({ code: SpanStatusCode.ERROR });
            }
            logger.emit({
              severityNumber: SeverityNumber.INFO,
              severityText: "INFO",
              body: "request",
              attributes: {
                method: req.method,
                path: url.pathname,
                status: String(res.status),
              },
            });
            return res;
          } catch (err) {
            exporterStatus = "degraded";
            span.recordException(err as Error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: err instanceof Error ? err.message : "error",
            });
            throw err;
          } finally {
            span.end();
          }
        },
      );
    },
    async shutdown() {
      await Promise.all([
        tracerProvider.shutdown(),
        loggerProvider.shutdown(),
        meterProvider.shutdown(),
      ]);
    },
  };

  telemetry.info("otel started", {
    endpoint: base,
    signals: "traces,logs,metrics",
    metrics: "on",
  });

  return telemetry;
}

function parseResourceAttr(key: string): string | undefined {
  const raw = Bun.env.OTEL_RESOURCE_ATTRIBUTES;
  if (!raw) return undefined;
  for (const part of raw.split(",")) {
    const [k, ...rest] = part.split("=");
    if (k?.trim() === key) return rest.join("=").trim();
  }
  return undefined;
}
