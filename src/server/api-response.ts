import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';
import type { ApiErrorResponse } from '@/contracts';
import { isAppError, ValidationError } from '@/services/errors';
import { logger } from './logger';

const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '[::1]', '::1']);

function isSameLocalOrExactOrigin(originHeader: string, requestUrl: string): boolean {
  if (originHeader === 'null') {
    return false;
  }
  try {
    const originUrl = new URL(originHeader);
    const targetUrl = new URL(requestUrl);
    if (originUrl.origin === targetUrl.origin) {
      return true;
    }
    return (
      originUrl.protocol === targetUrl.protocol &&
      originUrl.port === targetUrl.port &&
      LOOPBACK_HOSTS.has(originUrl.hostname) &&
      LOOPBACK_HOSTS.has(targetUrl.hostname)
    );
  } catch {
    return false;
  }
}

export function assertSameOriginMutation(request?: Request): void {
  if (!request) {
    return;
  }
  const secFetchSite = request.headers.get('sec-fetch-site');
  if (secFetchSite === 'cross-site') {
    throw new ValidationError('Cross-origin mutation requests are not allowed');
  }
  const origin = request.headers.get('origin');
  if (origin !== null && !isSameLocalOrExactOrigin(origin, request.url)) {
    throw new ValidationError('Cross-origin mutation requests are not allowed');
  }
}

export async function parseJsonBody(request: Request): Promise<unknown> {
  assertSameOriginMutation(request);
  const contentType = request.headers.get('content-type');
  if (contentType !== null && !contentType.toLowerCase().includes('application/json')) {
    throw new ValidationError('Content-Type must be application/json');
  }
  try {
    return await request.json();
  } catch {
    throw new ValidationError('Malformed JSON request body');
  }
}

export function parseUuidParam(value: string, message: string): string {
  return z.string().uuid(message).parse(value);
}

function zodFieldsToMap(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : 'root';
    if (!fields[key]) {
      fields[key] = issue.message;
    }
  }
  return fields;
}

export function handleApiError(error: unknown): NextResponse<ApiErrorResponse> {
  if (isAppError(error)) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.fields ? { fields: error.fields } : {}),
        },
      },
      { status: error.httpStatus },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request input',
          fields: zodFieldsToMap(error),
        },
      },
      { status: 400 },
    );
  }

  logger.error('Unhandled API error', {
    error: error instanceof Error ? error.message : String(error),
  });

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    },
    { status: 500 },
  );
}
