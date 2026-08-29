import type { RuntimeContext } from "../../../core/runtime-context";

/** Port — application/presentation depend on this, not OTel packages. */
export type Telemetry = {
  /** One span (+ request log) per HTTP request. */
  withRequestSpan(
    req: Request,
    handle: () => Response | Promise<Response>,
  ): Promise<Response>;
  info(message: string, attributes?: Record<string, string>): void;
  /** Named counter — FireWeave adoption/error signals (`feature.*.adopted`). */
  increment(name: string, attributes?: Record<string, string>): void;
  /** Named histogram — FireWeave measured signals. */
  record(
    name: string,
    value: number,
    attributes?: Record<string, string>,
  ): void;
  shutdown(): Promise<void>;
  readonly exporterStatus: "healthy" | "degraded";
};

export type TelemetryFactory = (ctx: RuntimeContext) => Telemetry;
