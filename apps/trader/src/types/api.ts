export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiRequestOptions {
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ApiError {
  status: number;
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'RATE_LIMITED' | 'VALIDATION' | 'HTTP';
  message: string;
  details?: unknown;
  fieldErrors?: Record<string, string[]>;
}

export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
  onRateLimited?: () => void;
}
