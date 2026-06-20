import { test, expect } from '../../src/fixtures/index.js';

const ECOM_BASE  = 'https://rahulshettyacademy.com/api/ecom';
const ECOM_EMAIL = process.env.TEST_USERNAME || '';
const ECOM_PASS  = process.env.TEST_PASSWORD || '';

test.describe('@API Ecom Orders', () => {

  test.beforeAll(() => {
    if (!ECOM_EMAIL || !ECOM_PASS) {
      test.skip(true, 'Ecom credentials not provided — set TEST_USERNAME and TEST_PASSWORD to run this suite');
    }
  });

  let token:     string;
  let productId: string;

  test.beforeAll(async ({ playwright }) => {
    const ctx = await playwright.request.newContext();

    const loginRes = await ctx.post(`${ECOM_BASE}/auth/login`, {
      data: { userEmail: ECOM_EMAIL, userPassword: ECOM_PASS },
    });
    expect(loginRes.status()).toBe(200);
    token = (await loginRes.json()).token;
    expect(token).toBeTruthy();

    const productsRes = await ctx.get(`${ECOM_BASE}/product/get-all-products`, {
      headers: { Authorization: token },
    });
    if (productsRes.ok()) {
      const body = await productsRes.json();
      const products = body.data ?? body.products ?? [];
      if (products.length > 0) {
        productId = products[0]._id;
      }
    }

    await ctx.dispose();
  });

  test('login returns a valid token', async ({ request }) => {
    const res  = await request.post(`${ECOM_BASE}/auth/login`, {
      data: { userEmail: ECOM_EMAIL, userPassword: ECOM_PASS },
    });
    const body = await res.json();

    expect(res.status()).toBe(200);
    expect(body.token).toBeTruthy();
  });

  test('create order returns orderId', async ({ request }) => {
    if (!productId) return test.skip();

    const orderRes = await request.post(`${ECOM_BASE}/order/create-order`, {
      data:    { orders: [{ country: 'India', productOrderedId: productId }] },
      headers: { Authorization: token, 'Content-Type': 'application/json' },
    });
    const body = await orderRes.json();

    expect(orderRes.status()).toBe(201);
    expect(body.orders).toBeDefined();
    expect(body.orders[0]).toBeTruthy();
  });

});
