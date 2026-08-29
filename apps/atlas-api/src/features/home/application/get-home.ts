import type { RuntimeContext } from "../../../core/runtime-context";

/** Root landing — one line; OTel span wired later without touching domain. */
export function getHomeBody(ctx: RuntimeContext): string {
  return `${ctx.service}\n`;
}
