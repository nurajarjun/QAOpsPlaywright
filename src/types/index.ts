export interface User {
  username: string;
  password: string;
}

export interface OrderTestData {
  username:    string;
  password:    string;
  productName: string;
}

export interface LoginPayload {
  userEmail:    string;
  userPassword: string;
}

export interface OrderPayload {
  orders: Array<{
    country:   string;
    productOrderedId: string;
  }>;
}

export interface ApiResponse {
  token:   string;
  orderId: string;
}

export interface EnvironmentConfig {
  baseUrl:    string;
  apiBaseUrl: string;
  timeout:    number;
  retries:    number;
  headless:   boolean;
}
