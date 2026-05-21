import type {
  ApiClientConfig,
  ApiError,
  ApiRequestBody,
  ApiRequestOptions,
} from '~/types/api';

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

function createApiError(
  input: Partial<ApiError> & Pick<ApiError, 'message' | 'code'>,
): ApiError {
  return {
    status: input.status ?? 0,
    message: input.message,
    code: input.code,
    details: input.details,
    fieldErrors: input.fieldErrors,
  };
}

function resolveErrorMessage(
  status: number,
  payload: unknown,
  serviceLabel: string,
): string {
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
    return 'Your shared operator session is no longer authorized.';
  }
  if (status === 403) {
    return 'You do not have permission to perform this music action.';
  }
  if (status === 429) {
    return `${serviceLabel} rate limit reached. Please retry shortly.`;
  }
  if (status === 422) {
    return 'Request validation failed.';
  }
  if (status >= 500) {
    return `${serviceLabel} is unavailable right now. Try again soon.`;
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

function isBodyInit(body: ApiRequestBody): body is BodyInit {
  if (body === null || body === undefined) {
    return false;
  }

  if (typeof body === 'string') {
    return true;
  }

  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    return true;
  }

  if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
    return true;
  }

  if (typeof Blob !== 'undefined' && body instanceof Blob) {
    return true;
  }

  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    return true;
  }

  return false;
}

function serializeBody(body: ApiRequestBody): BodyInit | undefined {
  if (body === null || body === undefined) {
    return undefined;
  }

  if (isBodyInit(body)) {
    return body;
  }

  return JSON.stringify(body);
}

export class ApiClient {
  constructor(private readonly config: ApiClientConfig) {}

  private buildHeaders(options: ApiRequestOptions): Record<string, string> {
    const token = this.config.getToken?.() ?? null;
    const needsJsonContentType =
      options.body !== null &&
      options.body !== undefined &&
      !isBodyInit(options.body);

    return {
      Accept: 'application/json',
      ...(needsJsonContentType ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    };
  }

  private buildUrl(path: string, query?: ApiRequestOptions['query']): string {
    const cleanBase = this.config.baseUrl.endsWith('/')
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}${buildQueryString(query)}`;
  }

  private async executeRequest(
    path: string,
    options: ApiRequestOptions = {},
  ): Promise<Response> {
    const baseUrl = this.config.baseUrl.trim();
    if (!baseUrl) {
      throw createApiError({
        code: 'CONFIG',
        message: `${this.config.serviceLabel ?? 'API'} base URL is not configured.`,
      });
    }

    try {
      return await fetch(this.buildUrl(path, options.query), {
        method: options.method ?? 'GET',
        headers: this.buildHeaders(options),
        body: serializeBody(options.body),
        signal: options.signal,
        credentials: 'include',
      });
    } catch (error) {
      throw createApiError({
        code: 'NETWORK',
        message: `${this.config.serviceLabel ?? 'API'} could not be reached.`,
        details: error,
      });
    }
  }

  async request<T>(
    path: string,
    options: ApiRequestOptions = {},
  ): Promise<T> {
    const response = await this.executeRequest(path, options);
    const payload = await parseResponseBody(response);

    if (!response.ok) {
      const error: ApiError = {
        status: response.status,
        code: classifyCode(response.status),
        message: resolveErrorMessage(
          response.status,
          payload,
          this.config.serviceLabel ?? 'API',
        ),
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
