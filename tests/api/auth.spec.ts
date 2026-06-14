import { test, expect } from '../../src/fixtures/index.js';
import { AuthResponse, MeResponse } from '../../src/types/eventhub.js';

const timestamp = Date.now();
const testUser  = {
  email:    `qatest_${timestamp}@mailinator.com`,
  password: 'Test@12345',
};

test.describe('@API Auth', () => {

  test.describe('POST /auth/register', () => {

    test('valid registration returns 201 with token', async ({ eventHubApi }) => {
      const res  = await eventHubApi.register(testUser);
      const body = await res.json() as AuthResponse;

      expect(res.status()).toBe(201);
      expect(body.token).toBeTruthy();
      expect(body.user.email).toBe(testUser.email);
      expect(body.user.id).toBeGreaterThan(0);
    });

    test('duplicate registration returns 400', async ({ eventHubApi }) => {
      await eventHubApi.register(testUser);
      const res = await eventHubApi.register(testUser);
      expect([400, 409]).toContain(res.status());
    });

    test('missing email returns 400', async ({ eventHubApi }) => {
      const res = await eventHubApi.register({ email: '', password: 'Test@12345' });
      expect(res.status()).toBe(400);
    });

    test('missing password returns 400', async ({ eventHubApi }) => {
      const res = await eventHubApi.register({
        email:    `qatest_nopw_${timestamp}@mailinator.com`,
        password: '',
      });
      expect(res.status()).toBe(400);
    });

  });

  test.describe('POST /auth/login', () => {

    test('valid login returns 200 with token', async ({ eventHubApi }) => {
      await eventHubApi.register(testUser);
      const res  = await eventHubApi.login(testUser);
      const body = await res.json() as AuthResponse;

      expect(res.status()).toBe(200);
      expect(body.token).toBeTruthy();
      expect(body.user.email).toBe(testUser.email);
    });

    test('wrong password returns 400', async ({ eventHubApi }) => {
      await eventHubApi.register(testUser);
      const res = await eventHubApi.login({ email: testUser.email, password: 'wrongpassword' });
      expect(res.status()).toBe(400);
    });

    test('non-existent user returns 400 or 404', async ({ eventHubApi }) => {
      const res = await eventHubApi.login({ email: 'ghost_nobody@mailinator.com', password: 'Test@12345' });
      expect([400, 404]).toContain(res.status());
    });

  });

  test.describe('GET /auth/me', () => {

    test('valid token returns user identity', async ({ eventHubApi }) => {
      await eventHubApi.register(testUser);
      await eventHubApi.loginAndSetToken(testUser);

      const res  = await eventHubApi.me();
      const body = await res.json();

      expect(res.status()).toBe(200);
      // API may return { email } directly or { user: { email } } — handle both
      const email = body.email ?? body.user?.email;
      expect(email).toBe(testUser.email);
    });

    test('missing token returns 401', async ({ eventHubApi }) => {
      const res = await eventHubApi.me('');
      expect(res.status()).toBe(401);
    });

    test('invalid token returns 401', async ({ eventHubApi }) => {
      const res = await eventHubApi.me('invalid.token.here');
      expect(res.status()).toBe(401);
    });

  });

});
