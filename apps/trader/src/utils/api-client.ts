import type { ApiClientConfig, ApiError, ApiRequestOptions } from '~/types/api';

function buildQueryString(
  query?: Record<string, string | number | boolean | null | undefined>,
): string {
  if (!query) {
    return '';
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    searchParams.set(key, String(value));
  }

  const encoded = searchParams.toString();
  return encoded.length ? `?${encoded}` : '';
}

function normalizeFieldErrors(details: unknown): Record<string, string[]> | undefined {
  if (!details || typeof details !== 'object') {
    return undefined;
  }

  const message = (details as { message?: unknown }).message;
  if (!Array.isArray(message)) {
    return undefined;
  }

  const fieldErrors: Record<string, string[]> = {};
  for (const entry of message) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }

    const property = (entry as { property?: unknown }).property;
    const constraints = (entry as { constraints?: unknown }).constraints;

    if (typeof property !== 'string' || !constraints || typeof constraints !== 'object') {
      continue;
    }

    fieldErrors[property] = Object.values(constraints).filter(
      (constraint): constraint is string => typeof constraint === 'string',
    );
  }

  return Object.keys(fieldErrors).length ? fieldErrors : undefined;
}

function resolveErrorMessage(status: number, payload: unknown): string {
  if (payload && typeof payload === 'object') {
    const directMessage = (payload as { message?: unknown }).message;
    if (typeof directMessage === 'string') {
      return directMessage;
    }

    if (Array.isArray(directMessage)) {
      const first = directMessage[0];
      if (typeof first === 'string') {
        return first;
      }
    }
  }

  if (status === 401) {
    return 'Your session is no longer authorized. Please refresh credentials.';
  }
  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }
  if (status === 429) {
    return 'Trader API rate limit reached. Please retry shortly.';
  }
  if (status === 422) {
    return 'Request validation failed.';
  }
  if (status >= 500) {
    return 'Trader API is unavailable right now. Try again soon.';
  }

  return `Request failed with status ${status}.`;
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function classifyCode(status: number): ApiError['code'] {
  if (status === 401) {
    return 'UNAUTHORIZED';
  }
  if (status === 403) {
    return 'FORBIDDEN';
  }
  if (status === 429) {
    return 'RATE_LIMITED';
  }
  if (status === 422) {
    return 'VALIDATION';
  }
  return 'HTTP';
}

export class ApiClient {
  constructor(private readonly config: ApiClientConfig) {}

  async request<T>(
    path: string,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const token = this.config.getToken?.() ?? null;
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    };

    const cleanBase = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${cleanBase}${cleanPath}${buildQueryString(options.query)}`;

    const response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.signal,
      credentials: 'include',
    });

    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        code: classifyCode(response.status),
        message: resolveErrorMessage(response.status, payload),
        details: payload,
        fieldErrors: normalizeFieldErrors(payload),
      };

      if (response.status === 401) {
        this.config.onUnauthorized?.();
      }

      if (response.status === 429) {
        this.config.onRateLimited?.();
      }

      throw error;
    }

    return payload as T;
  }
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  return new ApiClient(config);
}
