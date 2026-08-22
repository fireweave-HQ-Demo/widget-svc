import { logs, SeverityNumber } from "@opentelemetry/api-logs";
import { trace, SpanStatusCode, type Tracer } from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
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
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_NAMESPACE,
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
} from "@opentelemetry/semantic-conventions";
import type { RuntimeContext } from "../../../core/runtime-context";
import type { Telemetry } from "../application/ports/telemetry";

/**
 * Infrastructure: traces + logs → OTLP HTTP collector.
 * Metrics intentionally omitted (off by default; PostHog cannot ingest).
 */
export function startOtel(ctx: RuntimeContext): Telemetry {
  const base = ctx.exporterEndpoint.replace(/\/$/, "");
  const resource = resourceFromAttributes({
    [ATTR_SERVICE_NAME]: ctx.service,
    [ATTR_SERVICE_NAMESPACE]:
      process.env.OTEL_SERVICE_NAMESPACE ??
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
      await tracerProvider.shutdown();
      await loggerProvider.shutdown();
    },
  };

  telemetry.info("otel started", {
    endpoint: base,
    signals: "traces,logs",
    metrics: "off",
  });

  return telemetry;
}

function parseResourceAttr(key: string): string | undefined {
  const raw = process.env.OTEL_RESOURCE_ATTRIBUTES;
  if (!raw) return undefined;
  for (const part of raw.split(",")) {
    const [k, ...rest] = part.split("=");
    if (k?.trim() === key) return rest.join("=").trim();
  }
  return undefined;
}
