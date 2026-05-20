import { PostHog } from 'posthog-node';

const client = new PostHog(process.env.POSTHOG_API_KEY ?? '', {
  host: process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
});

/** Shared rollout flag — set FLAG_KEY in .env or GitHub repo variables. */
export const FLAG_KEY = process.env.FLAG_KEY ?? 'widget-demo-feature';

/**
 * Single wrap-point for FireWeave safe-rollout demos.
 * Empty body after the check is intentional.
 */
export async function maybeNewBehavior(userId: string): Promise<boolean> {
  if (!process.env.POSTHOG_API_KEY) return false;
  const enabled = await client.isFeatureEnabled(FLAG_KEY, userId);
  if (!enabled) return false;
  return true;
}
