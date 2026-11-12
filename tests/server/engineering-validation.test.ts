import { createLearningSessionInputSchema } from '@/contracts/learning-room';
import { logScreenTimeInputSchema } from '@/contracts/tracking';
import { describe, expect, it } from 'vitest';
import { createEventInputSchema } from '@/contracts/event';
import { handleApiError } from '@/server/api-response';
import { ValidationError } from '@/services/errors';

describe('mutation validation', () => {
  it('rejects invalid instants', () => {
    expect(createEventInputSchema.safeParse({ title: 'Test', category: 'school', startAt: 'not-a-date' }).success).toBe(false);
  });
  it('rejects impossible session and screen-time totals', () => {
    expect(createLearningSessionInputSchema.safeParse({ title: 'Test', durationMinutes: 1, focusMinutes: 2 }).success).toBe(false);
    expect(logScreenTimeInputSchema.safeParse({ date: '2026-11-10', totalMinutes: 30, productiveMinutes: 25, leisureMinutes: 20 }).success).toBe(false);
  });
  it('maps branded errors across module prototype boundaries', async () => {
    const error = new ValidationError('Choose a future deadline', { deadlineAt: 'Past' });
    Object.setPrototypeOf(error, Error.prototype);
    const response = handleApiError(error);
    expect(response.status).toBe(400);
    expect((await response.json()).error.fields.deadlineAt).toBe('Past');
  });
});
