import { PostHog } from 'posthog-node';

/** Shared rollout flag — set FLAG_KEY in .env or GitHub variables. */
export const FLAG_KEY = process.env.FLAG_KEY ?? 'widget-demo-feature';

let client: PostHog | null = null;

function getClient(): PostHog | null {
  const key = process.env.POSTHOG_API_KEY?.trim();
  if (!key) return null;
  if (!client) {
    client = new PostHog(key, {
      host: process.env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
    });
  }
  return client;
}

/**
 * Single wrap-point for FireWeave safe-rollout demos.
 * Empty body after the check is intentional.
 */
export async function maybeNewBehavior(userId: string): Promise<boolean> {
  const ph = getClient();
  if (!ph) return false;
  const enabled = await ph.isFeatureEnabled(FLAG_KEY, userId);
  if (!enabled) return false;
  return true;
}
