import { test, expect } from '../../src/fixtures/index.js';
import { HealthResponse } from '../../src/types/eventhub.js';

test.describe('@API Health & Config', () => {

  test('GET /health — returns status 200 with db online', async ({ eventHubApi }) => {
    const res  = await eventHubApi.health();
    const body = await res.json() as HealthResponse;

    expect(res.status()).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.dbStatus).toBe('connected');
    expect(body.timestamp).toBeTruthy();
  });

  test('GET /config — returns feature flags', async ({ eventHubApi }) => {
    const res  = await eventHubApi.config();
    const body = await res.json();

    expect(res.status()).toBe(200);
    expect(typeof body.showExploreLinks).toBe('boolean');
  });

});
