import { Elysia } from 'elysia';
import { initFwHarness } from './fireweave/fw-harness';
import { FLAG_KEY, maybeNewBehavior } from './feature';

await initFwHarness();

const port = Number(process.env.PORT ?? 3101);

const app = new Elysia()
  .get('/health', () => ({
    ok: true,
    service: 'widget-svc',
    flagKey: FLAG_KEY,
  }))
  .get('/demo/:userId', async ({ params }) => {
    const enabled = await maybeNewBehavior(params.userId);
    return { userId: params.userId, flagKey: FLAG_KEY, enabled };
  })
  .listen(port);

console.log(`widget-svc listening on http://0.0.0.0:${port}`);
