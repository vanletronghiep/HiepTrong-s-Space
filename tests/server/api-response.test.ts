import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { ZodError, z } from 'zod';
import { POST as createTaskRoute } from '@/app/api/tasks/route';
import { DELETE as deleteTaskRoute, PATCH as patchTaskRoute } from '@/app/api/tasks/[id]/route';
import { POST as completeTaskRoute } from '@/app/api/tasks/[id]/complete/route';
import { POST as transferTaskRoute } from '@/app/api/tasks/[id]/transfer/route';
import { POST as markAllReadRoute } from '@/app/api/notifications/read-all/route';
import { NotFoundError, ValidationError } from '@/services/errors';
import { handleApiError } from '@/server/api-response';

describe('server/api-response', () => {
  it('translates AppError subclasses to structured JSON responses', async () => {
    const notFoundRes = handleApiError(new NotFoundError('Task not found'));
    expect(notFoundRes.status).toBe(404);
    expect(await notFoundRes.json()).toEqual({
      error: { code: 'NOT_FOUND', message: 'Task not found' },
    });

    const validationRes = handleApiError(
      new ValidationError('Deadline cannot be in the past', {
        deadlineAt: 'Must be in the future',
      }),
    );
    expect(validationRes.status).toBe(400);
    expect(await validationRes.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Deadline cannot be in the past',
        fields: { deadlineAt: 'Must be in the future' },
      },
    });
  });

  it('translates ZodError to 400 VALIDATION_ERROR with field messages', async () => {
    const schema = z.object({ title: z.string().min(1, 'Title is required') });
    let caught: unknown;
    try {
      schema.parse({ title: '' });
    } catch (err) {
      caught = err;
    }
    expect(caught).toBeInstanceOf(ZodError);

    const res = handleApiError(caught);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request input',
        fields: { title: 'Title is required' },
      },
    });
  });

  it('returns 400 VALIDATION_ERROR (not 500) on malformed JSON in POST / PATCH / transfer routes (C08)', async () => {
    const validUuid = '11111111-1111-4111-8111-111111111111';

    const postReq = new NextRequest('http://127.0.0.1:3000/api/tasks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"title": "unterminated',
    });
    const postRes = await createTaskRoute(postReq);
    expect(postRes.status).toBe(400);
    expect(await postRes.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON request body',
      },
    });

    const patchReq = new NextRequest(`http://127.0.0.1:3000/api/tasks/${validUuid}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: 'not-json',
    });
    const patchRes = await patchTaskRoute(patchReq, {
      params: Promise.resolve({ id: validUuid }),
    });
    expect(patchRes.status).toBe(400);
    expect(await patchRes.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON request body',
      },
    });

    const transferReq = new NextRequest(`http://127.0.0.1:3000/api/tasks/${validUuid}/transfer`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{bad',
    });
    const transferRes = await transferTaskRoute(transferReq, {
      params: Promise.resolve({ id: validUuid }),
    });
    expect(transferRes.status).toBe(400);
    expect(await transferRes.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON request body',
      },
    });
  });

  it('rejects cross-origin mutation requests and non-JSON content-types at the route boundary (R01)', async () => {
    const validUuid = '11111111-1111-4111-8111-111111111111';

    const crossOriginPost = new NextRequest('http://127.0.0.1:3000/api/tasks', {
      method: 'POST',
      headers: {
        origin: 'https://evil.example',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ title: 'Injected' }),
    });
    const crossOriginRes = await createTaskRoute(crossOriginPost);
    expect(crossOriginRes.status).toBe(400);
    expect(await crossOriginRes.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Cross-origin mutation requests are not allowed',
      },
    });

    const crossSiteFetch = new NextRequest(
      `http://127.0.0.1:3000/api/tasks/${validUuid}/complete`,
      {
        method: 'POST',
        headers: {
          'sec-fetch-site': 'cross-site',
        },
      },
    );
    const crossSiteRes = await completeTaskRoute(crossSiteFetch, {
      params: Promise.resolve({ id: validUuid }),
    });
    expect(crossSiteRes.status).toBe(400);

    const crossOriginDelete = new NextRequest(`http://127.0.0.1:3000/api/tasks/${validUuid}`, {
      method: 'DELETE',
      headers: { origin: 'null' },
    });
    const deleteRes = await deleteTaskRoute(crossOriginDelete, {
      params: Promise.resolve({ id: validUuid }),
    });
    expect(deleteRes.status).toBe(400);

    const crossOriginMarkAll = new NextRequest('http://127.0.0.1:3000/api/notifications/read-all', {
      method: 'POST',
      headers: { origin: 'http://attacker.local:4000' },
    });
    const markAllRes = await markAllReadRoute(crossOriginMarkAll);
    expect(markAllRes.status).toBe(400);

    const formUrlEncoded = new NextRequest('http://127.0.0.1:3000/api/tasks', {
      method: 'POST',
      headers: {
        origin: 'http://127.0.0.1:3000',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: 'title=test',
    });
    const formRes = await createTaskRoute(formUrlEncoded);
    expect(formRes.status).toBe(400);
    expect(await formRes.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Content-Type must be application/json',
      },
    });
  });
});
