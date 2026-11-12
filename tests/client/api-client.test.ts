import { describe, expect, it, vi } from 'vitest';
import { apiRequest, ClientApiError } from '@/client/api-client';

describe('client/api-client', () => {
  it('serializes an object body to JSON without double stringification', async () => {
    let capturedBody: unknown;
    let capturedHeaders: Headers | undefined;

    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
      capturedBody = init?.body;
      capturedHeaders = new Headers(init?.headers);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const res = await apiRequest<{ ok: boolean }>('/api/test', {
      method: 'POST',
      body: { title: 'Clean object' },
    });

    expect(res).toEqual({ ok: true });
    expect(capturedHeaders?.get('Content-Type')).toBe('application/json');
    expect(capturedBody).toBe('{"title":"Clean object"}');
    // Ensure it parses back directly to the object, NOT a string
    expect(JSON.parse(capturedBody as string)).toEqual({ title: 'Clean object' });
  });

  it('safely handles pre-stringified JSON body without double stringification', async () => {
    let capturedBody: unknown;

    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async (_url, init) => {
      capturedBody = init?.body;
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    });

    const preStringified = JSON.stringify({ title: 'Pre-stringified' });
    const res = await apiRequest<{ ok: boolean }>('/api/test', {
      method: 'POST',
      body: preStringified,
    });

    expect(res).toEqual({ ok: true });
    // Must NOT be "\"{\\\"title\\\":...}\""
    expect(capturedBody).toBe('{"title":"Pre-stringified"}');
    expect(JSON.parse(capturedBody as string)).toEqual({ title: 'Pre-stringified' });
  });

  it('parses structured ApiErrorResponse into ClientApiError', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid deadline date',
            fields: { deadlineAt: 'Must be in the future' },
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    });

    await expect(apiRequest('/api/test')).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ClientApiError);
      const apiErr = err as ClientApiError;
      expect(apiErr.code).toBe('VALIDATION_ERROR');
      expect(apiErr.message).toBe('Invalid deadline date');
      expect(apiErr.httpStatus).toBe(400);
      expect(apiErr.fields).toEqual({ deadlineAt: 'Must be in the future' });
      return true;
    });
  });

  it('extracts legacy error string if error response is not structured', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementationOnce(async () => {
      return new Response(
        JSON.stringify({ error: 'Legacy custom error message' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } },
      );
    });

    await expect(apiRequest('/api/test')).rejects.toSatisfy((err: unknown) => {
      expect(err).toBeInstanceOf(ClientApiError);
      const apiErr = err as ClientApiError;
      expect(apiErr.message).toBe('Legacy custom error message');
      expect(apiErr.httpStatus).toBe(404);
      return true;
    });
  });
});

