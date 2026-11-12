import { apiErrorResponseSchema } from '@/contracts';

export class ClientApiError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;
  public readonly fields?: Record<string, string>;

  constructor(options: {
    code: string;
    message: string;
    httpStatus: number;
    fields?: Record<string, string>;
  }) {
    super(options.message);
    this.name = 'ClientApiError';
    this.code = options.code;
    this.httpStatus = options.httpStatus;
    this.fields = options.fields;
  }
}

export async function apiRequest<TResponse>(
  path: string,
  init?: Omit<RequestInit, 'body'> & { body?: unknown },
): Promise<TResponse> {
  const headers = new Headers(init?.headers);
  let serializedBody: BodyInit | undefined;

  if (init?.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    serializedBody = typeof init.body === 'string' ? init.body : JSON.stringify(init.body);
  }

  const response = await fetch(path, {
    ...init,
    headers,
    body: serializedBody,
  });

  const rawJson: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsedError = apiErrorResponseSchema.safeParse(rawJson);
    if (parsedError.success) {
      throw new ClientApiError({
        code: parsedError.data.error.code,
        message: parsedError.data.error.message,
        httpStatus: response.status,
        fields: parsedError.data.error.fields,
      });
    }

    const legacyErrorMessage =
      typeof rawJson === 'object' &&
        rawJson !== null &&
        'error' in rawJson &&
        typeof (rawJson as { error: unknown }).error === 'string'
        ? (rawJson as { error: string }).error
        : undefined;

    throw new ClientApiError({
      code: 'HTTP_ERROR',
      message: legacyErrorMessage ?? `Request failed with status ${response.status}`,
      httpStatus: response.status,
    });
  }

  return rawJson as TResponse;
}
