import { randomUUID } from 'node:crypto';
import type {
  CreateLearningSessionInput,
  LearningRoomStats,
  LearningSession,
} from '@/contracts/learning-room';
import { buildFocusStats } from '@/domain/focus-stats';
import { JsonFileStore } from '@/services/storage/json-store';

const sessionStore = new JsonFileStore<LearningSession>('learning-room-sessions.json');

export class LearningRoomService {
  async getSessions(): Promise<LearningSession[]> {
    const list = await sessionStore.getAll();
    // Sessions saved before block times were recorded have no `focusIntervals` on disk.
    const normalized = list.map((session) => ({
      ...session,
      focusIntervals: session.focusIntervals ?? [],
    }));
    return normalized.sort(
      (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
    );
  }

  async createSession(input: CreateLearningSessionInput): Promise<LearningSession> {
    const now = new Date().toISOString();

    const newSession: LearningSession = {
      id: `lr-${randomUUID().slice(0, 8)}`,
      title: input.title,
      mode: input.mode ?? 'pomodoro',
      targetSubject: input.targetSubject ?? 'General',
      relatedProjectId: input.relatedProjectId ?? null,
      relatedTaskId: input.relatedTaskId ?? null,
      startedAt:
        input.startedAt ??
        new Date(
          Date.parse(now) -
            ((input.focusMinutes ?? 0) + (input.breakMinutes ?? 0) + (input.pausedMinutes ?? 0)) *
              60000,
        ).toISOString(),
      completedAt: input.completedAt ?? now,
      durationMinutes: input.durationMinutes ?? 25,
      focusMinutes: input.focusMinutes ?? 0,
      breakMinutes: input.breakMinutes ?? 0,
      pausedMinutes: input.pausedMinutes ?? 0,
      status: input.status ?? 'completed',
      reflectionNotes: input.reflectionNotes ?? '',
      rating: input.rating ?? 4,
      focusIntervals: input.focusIntervals ?? [],
    };

    await sessionStore.save(newSession);
    return newSession;
  }

  /** Permanently remove every saved session. Returns how many were removed. */
  async clearSessions(): Promise<number> {
    const list = await sessionStore.getAll();
    for (const session of list) await sessionStore.delete(session.id);
    return list.length;
  }

  async getStats(): Promise<LearningRoomStats> {
    return buildFocusStats(await this.getSessions(), new Date());
  }
}

export const learningRoomService = new LearningRoomService();
