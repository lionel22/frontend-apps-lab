export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED'
  | 'VALIDATION'
  | 'HTTP'
  | 'NETWORK'
  | 'CONFIG';

export type ApiRequestBody =
  | BodyInit
  | Record<string, unknown>
  | unknown[]
  | null
  | undefined;

export interface ApiRequestOptions {
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | null | undefined>;
  body?: ApiRequestBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export interface ApiError {
  status: number;
  code: ApiErrorCode;
  message: string;
  details?: unknown;
  fieldErrors?: Record<string, string[]>;
}

export interface ApiClientConfig {
  baseUrl: string;
  serviceLabel?: string;
  getToken?: () => string | null;
  onUnauthorized?: () => void;
  onRateLimited?: () => void;
}
