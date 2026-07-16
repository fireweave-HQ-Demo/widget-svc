import { OpenFeature } from '@openfeature/server-sdk';

export const EXPERIMENT_META_FLAG = 'widget-experiment-meta';

export type ExperimentMeta = {
  variant: 'treatment';
  experimentId: 'widget-experiment-meta';
  source: 'widget-svc';
  emittedAt: string;
};

/** Metric emit helper — call sites must pass string literals for assert_dev_checklist. */
export function track(name: string): void {
  console.info(`[fw-metric] ${name}`);
}

/**
 * Dark-launch wrap-point: when the API flag is on, return experimentMeta for
 * the response. Clients must ignore this until `widget-experiment-meta-ui`.
 */
export async function resolveExperimentMeta(
  userId: string,
): Promise<ExperimentMeta | undefined> {
  try {
    const client = OpenFeature.getClient();
    // @fireweave-flag widget-experiment-meta
    const enabled = await client.getBooleanValue(EXPERIMENT_META_FLAG, false, {
      targetingKey: userId,
    });
    if (!enabled) return undefined;

    track('feature.widget-experiment-meta.adopted');
    return {
      variant: 'treatment',
      experimentId: 'widget-experiment-meta',
      source: 'widget-svc',
      emittedAt: new Date().toISOString(),
    };
  } catch {
    track('feature.widget-experiment-meta.error');
    return undefined;
  }
}
