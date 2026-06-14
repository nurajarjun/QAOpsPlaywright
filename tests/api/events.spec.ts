import { test, expect } from '../../src/fixtures/index.js';
import { Event, PaginatedResponse } from '../../src/types/eventhub.js';

const timestamp = Date.now();
const testUser  = { email: `qaevents_${timestamp}@mailinator.com`, password: 'Test@12345' };

const eventPayload = {
  title:       `QA Summit ${timestamp}`,
  category:    'Technology',
  venue:       'Tech Convention Center',
  city:        'Bangalore',
  eventDate:   '2026-12-15T09:00:00.000Z',
  price:       999,
  totalSeats:  50,
  description: 'Annual QA and automation conference',
};

test.describe('@API Events', () => {

  let eventId: number;

  // Register once, then set token on each fresh fixture instance
  test.beforeAll(async ({ eventHubApi }) => {
    await eventHubApi.register(testUser);
    await eventHubApi.loginAndSetToken(testUser);
  });

  test.beforeEach(async ({ eventHubApi }) => {
    await eventHubApi.loginAndSetToken(testUser);
  });

  // Response shape: { success, data: Event|Event[], pagination?, message? }
  function item(raw: any): Event   { return raw.data ?? raw; }
  function list(raw: any): Event[] { return Array.isArray(raw.data) ? raw.data : raw; }

  test.describe('GET /events', () => {

    test('returns paginated event list', async ({ eventHubApi }) => {
      const res = await eventHubApi.listEvents();
      const raw = await res.json();

      expect(res.status()).toBe(200);
      expect(Array.isArray(raw.data)).toBe(true);
      expect(raw.pagination).toBeDefined();
    });

    test('filters by city', async ({ eventHubApi }) => {
      const res  = await eventHubApi.listEvents({ city: 'Bangalore' });
      const raw  = await res.json();
      const data = list(raw);

      expect(res.status()).toBe(200);
      if (data.length > 0) {
        data.forEach((e: Event) => expect(e.city.toLowerCase()).toContain('bangalore'));
      }
    });

    test('custom page and limit respected', async ({ eventHubApi }) => {
      const res  = await eventHubApi.listEvents({ page: 1, limit: 3 });
      const raw  = await res.json();
      const data = list(raw);

      expect(res.status()).toBe(200);
      expect(data.length).toBeLessThanOrEqual(3);
    });

  });

  test.describe('POST /events', () => {

    test('creates event — availableSeats equals totalSeats', async ({ eventHubApi }) => {
      const res  = await eventHubApi.createEvent(eventPayload);
      const body = item(await res.json());

      expect(res.status()).toBe(201);
      expect(body.id).toBeGreaterThan(0);
      expect(body.title).toBe(eventPayload.title);
      expect(body.availableSeats).toBe(eventPayload.totalSeats);
      eventId = body.id;
    });

    test('missing required field returns 400', async ({ eventHubApi }) => {
      const { title: _, ...incomplete } = eventPayload;
      const res = await eventHubApi.createEvent(incomplete as any);
      expect(res.status()).toBe(400);
    });

    test('unauthenticated request returns 401', async ({ eventHubApi }) => {
      const res = await eventHubApi.createEvent(eventPayload, '');
      expect(res.status()).toBe(401);
    });

  });

  test.describe('GET /events/{id}', () => {

    test('returns event by id', async ({ eventHubApi }) => {
      if (!eventId) {
        eventId = item(await (await eventHubApi.createEvent(eventPayload)).json()).id;
      }
      const body = item(await (await eventHubApi.getEvent(eventId)).json());

      expect(body.id).toBe(eventId);
    });

    test('non-existent id returns 404', async ({ eventHubApi }) => {
      const res = await eventHubApi.getEvent(999999999);
      expect(res.status()).toBe(404);
    });

  });

  test.describe('PUT /events/{id}', () => {

    test('updates event title and price', async ({ eventHubApi }) => {
      if (!eventId) {
        eventId = item(await (await eventHubApi.createEvent(eventPayload)).json()).id;
      }
      const updated = { ...eventPayload, title: `Updated Summit ${timestamp}`, price: 1299 };
      const res  = await eventHubApi.updateEvent(eventId, updated);
      const body = item(await res.json());

      expect(res.status()).toBe(200);
      expect(body.title).toBe(updated.title);
      // API returns price as string
      expect(Number(body.price)).toBe(updated.price);
    });

  });

  test.describe('DELETE /events/{id}', () => {

    test('deletes event — subsequent GET returns 404', async ({ eventHubApi }) => {
      const create = await eventHubApi.createEvent({ ...eventPayload, title: `Delete Me ${timestamp}` });
      const id     = item(await create.json()).id;

      expect(create.status()).toBe(201);
      expect((await eventHubApi.deleteEvent(id)).status()).toBe(200);
      expect((await eventHubApi.getEvent(id)).status()).toBe(404);
    });

  });

});
