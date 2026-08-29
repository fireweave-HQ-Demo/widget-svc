import type { RuntimeContext } from "../../../core/runtime-context";

export function getHomeBody(ctx: RuntimeContext): string {
  return `${ctx.service}\n`;
}
