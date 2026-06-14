import { APIRequestContext } from '@playwright/test';
import { LoginPayload, OrderPayload, ApiResponse } from '../types';
import { API_ENDPOINTS } from '../constants';

const API_BASE = process.env.API_BASE_URL || 'https://rahulshettyacademy.com/api/ecom';

export class ApiHelper {
  constructor(private apiContext: APIRequestContext) {}

  async getToken(payload: LoginPayload): Promise<string> {
    const response = await this.apiContext.post(`${API_BASE}${API_ENDPOINTS.LOGIN}`, {
      data: payload,
    });
    const body = await response.json();
    return body.token;
  }

  async createOrder(loginPayload: LoginPayload, orderPayload: OrderPayload): Promise<ApiResponse> {
    const token = await this.getToken(loginPayload);
    const response = await this.apiContext.post(`${API_BASE}${API_ENDPOINTS.CREATE_ORDER}`, {
      data: orderPayload,
      headers: {
        Authorization:  token,
        'Content-Type': 'application/json',
      },
    });
    const body = await response.json();
    return { token, orderId: body.orders[0] };
  }
}
