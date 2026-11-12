import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as learningPost } from '@/app/api/learning-room/route';
import { POST as eventPost } from '@/app/api/events/route';
import { DELETE as blogDelete } from '@/app/api/blogs/[id]/route';
import { GET as projectGet } from '@/app/api/projects/[id]/route';
import { POST as milestoneTogglePost } from '@/app/api/milestones/[id]/toggle-landmark/route';

describe('real route mutation boundaries', () => {
  it('rejects cross-site and plaintext mutations before any persistence', async () => {
    for (const headers of [
      { 'content-type': 'text/plain' },
      { 'content-type': 'application/json', origin: 'https://outside.example', 'sec-fetch-site': 'cross-site' },
    ] as Record<string, string>[]) {
      const response = await learningPost(new NextRequest('http://localhost:3000/api/learning-room', { method: 'POST', headers, body: '{"title":"test"}' }));
      expect(response.status).toBe(400);
    }
  });
  it('rejects malformed JSON and invalid event dates', async () => {
    for (const body of ['{broken', JSON.stringify({ title: 'test', category: 'school', startAt: 'invalid' })]) {
      const response = await eventPost(new NextRequest('http://localhost:3000/api/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body }));
      expect(response.status).toBe(400);
    }
  });
  it('guards bodyless deletes', async () => {
    const response = await blogDelete(new NextRequest('http://localhost:3000/api/blogs/a', { method: 'DELETE', headers: { origin: 'https://outside.example' } }), { params: Promise.resolve({ id: 'a' }) });
    expect(response.status).toBe(400);
  });
  it('returns structured ApiErrorResponse 404 for missing project', async () => {
    const response = await projectGet(new NextRequest('http://localhost:3000/api/projects/non-existent'), { params: Promise.resolve({ id: 'non-existent' }) });
    expect(response.status).toBe(404);
    const json = await response.json();
    expect(json).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Project not found',
      },
    });
  });
  it('returns structured ApiErrorResponse 400 for toggle-landmark with missing landmarkId', async () => {
    const response = await milestoneTogglePost(
      new NextRequest('http://localhost:3000/api/milestones/m1/toggle-landmark', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ id: 'm1' }) },
    );
    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error.code).toBe('VALIDATION_ERROR');
    expect(json.error.fields.landmarkId).toBe('Missing landmarkId');
  });
});
