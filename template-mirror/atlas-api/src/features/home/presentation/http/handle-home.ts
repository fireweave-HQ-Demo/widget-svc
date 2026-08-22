import type { RuntimeContext } from "../../../core/runtime-context";
import { getHomeBody } from "../../application/get-home";

export function handleHome(ctx: RuntimeContext): Response {
  return new Response(getHomeBody(ctx));
}
