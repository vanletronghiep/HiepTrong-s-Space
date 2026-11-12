import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const deletes = vi.hoisted(() => ({
  event: vi.fn(),
  project: vi.fn(),
  milestone: vi.fn(),
}));

vi.mock('@/services/event-service', () => ({
  eventService: { deleteEvent: deletes.event },
}));
vi.mock('@/services/project-service', () => ({
  projectService: { deleteProject: deletes.project },
}));
vi.mock('@/services/milestone-service', () => ({
  milestoneService: { deleteMilestone: deletes.milestone },
}));

import { DELETE as deleteEvent } from '@/app/api/events/[id]/route';
import { DELETE as deleteProject } from '@/app/api/projects/[id]/route';
import { DELETE as deleteMilestone } from '@/app/api/milestones/[id]/route';

beforeEach(() => {
  for (const remove of Object.values(deletes)) {
    remove.mockReset().mockResolvedValue(true);
  }
});

describe.each([
  ['events', deleteEvent, deletes.event],
  ['projects', deleteProject, deletes.project],
  ['milestones', deleteMilestone, deletes.milestone],
] as const)('%s DELETE origin boundary', (route, handler, remove) => {
  it.each<Record<string, string>>([
    { origin: 'https://outside.example' },
    { 'sec-fetch-site': 'cross-site' },
  ])('rejects an untrusted request before deleting data (%j)', async (headers) => {
    const response = await handler(
      new NextRequest(`http://localhost:3000/api/${route}/item`, {
        method: 'DELETE',
        headers,
      }),
      { params: Promise.resolve({ id: 'item' }) },
    );

    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe('VALIDATION_ERROR');
    expect(remove).not.toHaveBeenCalled();
  });

  it('preserves trusted local deletion', async () => {
    const response = await handler(
      new NextRequest(`http://localhost:3000/api/${route}/item`, {
        method: 'DELETE',
        headers: { origin: 'http://127.0.0.1:3000' },
      }),
      { params: Promise.resolve({ id: 'item' }) },
    );

    expect(response.status).toBe(200);
    expect(remove).toHaveBeenCalledExactlyOnceWith('item');
  });
});
