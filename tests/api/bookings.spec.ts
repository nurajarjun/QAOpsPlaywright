import { test, expect } from '../../src/fixtures/index.js';
import { Event, Booking, PaginatedResponse } from '../../src/types/eventhub.js';

const timestamp = Date.now();
const testUser  = { email: `qabookings_${timestamp}@mailinator.com`, password: 'Test@12345' };

const eventPayload = {
  title:      `Booking Test Event ${timestamp}`,
  category:   'Technology',
  venue:      'Arena Hall',
  city:       'Mumbai',
  eventDate:  '2026-11-20T10:00:00.000Z',
  price:      500,
  totalSeats: 10,
};

const bookingPayload = {
  customerName:  'QA Tester',
  customerEmail: 'qatester@mailinator.com',
  customerPhone: '9876543210',
  quantity:      2,
};

// Response shape: { success, data: T|T[], pagination?, message? }
function item<T>(raw: any): T           { return raw.data ?? raw; }
function list<T>(raw: any): T[]         { return Array.isArray(raw.data) ? raw.data : raw; }

test.describe('@API Bookings', () => {

  let eventId:    number;
  let bookingId:  number;
  let bookingRef: string;

  test.beforeAll(async ({ eventHubApi }) => {
    await eventHubApi.register(testUser);
    await eventHubApi.loginAndSetToken(testUser);
    eventId = item<Event>(await (await eventHubApi.createEvent(eventPayload)).json()).id;
  });

  test.beforeEach(async ({ eventHubApi }) => {
    await eventHubApi.loginAndSetToken(testUser);
  });

  test.describe('POST /bookings', () => {

    test('creates booking and decrements available seats', async ({ eventHubApi }) => {
      const before = item<Event>(await (await eventHubApi.getEvent(eventId)).json()).availableSeats;

      const res  = await eventHubApi.createBooking({ ...bookingPayload, eventId });
      const body = item<Booking>(await res.json());

      expect(res.status()).toBe(201);
      expect(body.id).toBeGreaterThan(0);
      expect(body.bookingRef).toBeTruthy();
      expect(body.status).toBe('confirmed');
      expect(body.quantity).toBe(bookingPayload.quantity);

      bookingId  = body.id;
      bookingRef = body.bookingRef;

      const after = item<Event>(await (await eventHubApi.getEvent(eventId)).json()).availableSeats;
      expect(after).toBe(before - bookingPayload.quantity);
    });

    test('quantity exceeding available seats returns 400', async ({ eventHubApi }) => {
      const res = await eventHubApi.createBooking({ ...bookingPayload, eventId, quantity: 999 });
      expect(res.status()).toBe(400);
    });

    test('quantity 0 returns 400', async ({ eventHubApi }) => {
      const res = await eventHubApi.createBooking({ ...bookingPayload, eventId, quantity: 0 });
      expect(res.status()).toBe(400);
    });

    test('quantity 11 (above max 10) returns 400', async ({ eventHubApi }) => {
      const res = await eventHubApi.createBooking({ ...bookingPayload, eventId, quantity: 11 });
      expect(res.status()).toBe(400);
    });

    test('non-existent eventId returns 400 or 404', async ({ eventHubApi }) => {
      const res = await eventHubApi.createBooking({ ...bookingPayload, eventId: 999999999 });
      expect([400, 404]).toContain(res.status());
    });

    test('missing customerName returns 400', async ({ eventHubApi }) => {
      const res = await eventHubApi.createBooking({ ...bookingPayload, eventId, customerName: '' });
      expect(res.status()).toBe(400);
    });

  });

  test.describe('GET /bookings', () => {

    test('returns paginated booking list', async ({ eventHubApi }) => {
      const res = await eventHubApi.listBookings();
      const raw = await res.json();

      expect(res.status()).toBe(200);
      expect(Array.isArray(raw.data)).toBe(true);
      expect(raw.pagination).toBeDefined();
    });

    test('filters by eventId', async ({ eventHubApi }) => {
      const res  = await eventHubApi.listBookings({ eventId });
      const data = list<Booking>(await res.json());

      expect(res.status()).toBe(200);
      if (data.length > 0) {
        data.forEach(b => expect(b.eventId).toBe(eventId));
      }
    });

    test('filters by status=confirmed', async ({ eventHubApi }) => {
      const res  = await eventHubApi.listBookings({ status: 'confirmed' });
      const data = list<Booking>(await res.json());

      expect(res.status()).toBe(200);
      if (data.length > 0) {
        data.forEach(b => expect(b.status).toBe('confirmed'));
      }
    });

  });

  test.describe('GET /bookings/{id}', () => {

    test('returns booking by id', async ({ eventHubApi }) => {
      if (!bookingId) return test.skip();
      const body = item<Booking>(await (await eventHubApi.getBooking(bookingId)).json());

      expect(body.id).toBe(bookingId);
      expect(body.bookingRef).toBe(bookingRef);
    });

    test('non-existent id returns 404', async ({ eventHubApi }) => {
      expect((await eventHubApi.getBooking(999999999)).status()).toBe(404);
    });

  });

  test.describe('GET /bookings/ref/{ref}', () => {

    test('returns booking by reference', async ({ eventHubApi }) => {
      if (!bookingRef) return test.skip();
      const body = item<Booking>(await (await eventHubApi.getBookingByRef(bookingRef)).json());

      expect(body.bookingRef).toBe(bookingRef);
    });

    test('invalid reference returns 404', async ({ eventHubApi }) => {
      expect((await eventHubApi.getBookingByRef('INVALID-REF-999')).status()).toBe(404);
    });

  });

  test.describe('DELETE /bookings/{id}', () => {

    test('cancels booking and restores seats', async ({ eventHubApi }) => {
      if (!bookingId) return test.skip();

      const before = item<Event>(await (await eventHubApi.getEvent(eventId)).json()).availableSeats;

      expect((await eventHubApi.cancelBooking(bookingId)).status()).toBe(200);

      const after = item<Event>(await (await eventHubApi.getEvent(eventId)).json()).availableSeats;
      expect(after).toBe(before + bookingPayload.quantity);
    });

    test('cancel non-existent booking returns 404', async ({ eventHubApi }) => {
      expect((await eventHubApi.cancelBooking(999999999)).status()).toBe(404);
    });

  });

});
