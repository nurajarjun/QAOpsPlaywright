export const URLS = {
  LOGIN:          '/client',
  DASHBOARD:      '/client/dashboard',
  ORDERS_HISTORY: '/client/ordersHistory',
} as const;

export const API_ENDPOINTS = {
  LOGIN:        '/auth/login',
  CREATE_ORDER: '/order/create-order',
  GET_ORDERS:   '/order/get-orders-for-customer',
} as const;

export const TIMEOUTS = {
  SHORT:   5_000,
  DEFAULT: 30_000,
  LONG:    60_000,
} as const;

export const BROWSERS = {
  CHROMIUM: 'chromium',
  WEBKIT:   'webkit',
  FIREFOX:  'firefox',
} as const;

export enum TestTag {
  WEB = '@Web',
  API = '@API',
  E2E = '@E2E',
  UI  = '@UI',
}
