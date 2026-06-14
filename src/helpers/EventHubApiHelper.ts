import { APIRequestContext, APIResponse } from '@playwright/test';
import {
  AuthInput, AuthResponse,
  CreateEventInput, PaginatedResponse,
  CreateBookingInput, HealthResponse,
} from '../types/eventhub.js';

const BASE = process.env.EVENTHUB_API_URL || 'https://api.eventhub.rahulshettyacademy.com/api';

export class EventHubApiHelper {
  // Set once (e.g. in beforeAll or beforeEach) — used automatically by all methods
  token: string = '';

  constructor(private api: APIRequestContext) {}

  // ── Auth ──────────────────────────────────────────────────────────────

  async register(input: AuthInput): Promise<APIResponse> {
    return this.api.post(`${BASE}/auth/register`, { data: input });
  }

  async login(input: AuthInput): Promise<APIResponse> {
    return this.api.post(`${BASE}/auth/login`, { data: input });
  }

  async loginAndSetToken(input: AuthInput): Promise<string> {
    const res  = await this.login(input);
    const body = await res.json() as AuthResponse;
    this.token = body.token;
    return this.token;
  }

  async me(token?: string): Promise<APIResponse> {
    return this.api.get(`${BASE}/auth/me`, { headers: this.bearer(token) });
  }

  // ── Events ────────────────────────────────────────────────────────────

  async listEvents(params?: Record<string, string | number>, token?: string): Promise<APIResponse> {
    return this.api.get(`${BASE}/events`, { params, headers: this.bearer(token) });
  }

  async createEvent(input: CreateEventInput, token?: string): Promise<APIResponse> {
    return this.api.post(`${BASE}/events`, { data: input, headers: this.bearer(token) });
  }

  async getEvent(id: number, token?: string): Promise<APIResponse> {
    return this.api.get(`${BASE}/events/${id}`, { headers: this.bearer(token) });
  }

  async updateEvent(id: number, input: CreateEventInput, token?: string): Promise<APIResponse> {
    return this.api.put(`${BASE}/events/${id}`, { data: input, headers: this.bearer(token) });
  }

  async deleteEvent(id: number, token?: string): Promise<APIResponse> {
    return this.api.delete(`${BASE}/events/${id}`, { headers: this.bearer(token) });
  }

  // ── Bookings ──────────────────────────────────────────────────────────

  async listBookings(params?: Record<string, string | number>, token?: string): Promise<APIResponse> {
    return this.api.get(`${BASE}/bookings`, { params, headers: this.bearer(token) });
  }

  async createBooking(input: CreateBookingInput, token?: string): Promise<APIResponse> {
    return this.api.post(`${BASE}/bookings`, { data: input, headers: this.bearer(token) });
  }

  async getBooking(id: number, token?: string): Promise<APIResponse> {
    return this.api.get(`${BASE}/bookings/${id}`, { headers: this.bearer(token) });
  }

  async getBookingByRef(ref: string, token?: string): Promise<APIResponse> {
    return this.api.get(`${BASE}/bookings/ref/${ref}`, { headers: this.bearer(token) });
  }

  async cancelBooking(id: number, token?: string): Promise<APIResponse> {
    return this.api.delete(`${BASE}/bookings/${id}`, { headers: this.bearer(token) });
  }

  // ── Utility ───────────────────────────────────────────────────────────

  async health(): Promise<APIResponse> {
    return this.api.get(`${BASE}/health`);
  }

  async config(): Promise<APIResponse> {
    return this.api.get(`${BASE}/config`);
  }

  // ── Private ───────────────────────────────────────────────────────────

  private bearer(override?: string): Record<string, string> {
    const t = override ?? this.token;
    return t ? { Authorization: `Bearer ${t}` } : {};
  }
}
