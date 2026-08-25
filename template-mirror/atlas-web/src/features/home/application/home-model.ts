import type { RuntimeContext } from "../../../core/runtime-context";

export type HomeModel = {
  title: string;
  service: string;
  environment: string;
  destination: string;
  framework: string;
  apiBase: string;
  otlp: string;
};

export function buildHomeModel(ctx: RuntimeContext): HomeModel {
  return {
    title: ctx.service,
    service: ctx.service,
    environment: ctx.environment,
    destination: ctx.destination,
    framework: ctx.framework,
    apiBase: ctx.apiBase,
    otlp: ctx.exporterEndpoint,
  };
}
