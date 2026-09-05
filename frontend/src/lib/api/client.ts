import { getStoredSession } from '../auth/session';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

type ApiErrorBody = {
  error?: string;
  details?: unknown;
};

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
  unauthorizedHandler = handler;

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null;
    }
  };
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly details?: unknown;

  public constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { body, headers, ...requestOptions } = options;
  const requestHeaders = new Headers(headers);
  const token = getStoredSession()?.token;

  if (body !== undefined) {
    requestHeaders.set('Content-Type', 'application/json');
  }

  if (token) {
    requestHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    if (response.status === 401) {
      unauthorizedHandler?.();
    }

    let errorBody: ApiErrorBody = {};

    try {
      errorBody = (await response.json()) as ApiErrorBody;
    } catch {
      // Keep the HTTP status when the server does not return JSON.
    }

    throw new ApiError(
      response.status,
      errorBody.error ?? `API request failed with status ${response.status}`,
      errorBody.details,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
