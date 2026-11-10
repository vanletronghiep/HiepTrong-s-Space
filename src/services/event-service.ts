import { createEventInputSchema, type CreateEventInput, type EventItem } from '@/contracts/event';
import { JsonFileStore } from './storage/json-store';

const initialEvents: EventItem[] = [
  {
    id: 'evt-calc1-midterm',
    title: 'Calculus I Midterm Examination',
    description: 'Covers limits, continuity, and derivatives (Chapters 1-3). Bring student card and scientific calculator.',
    category: 'exam',
    startAt: new Date(Date.now() + 4 * 86_400_000).toISOString(),
    endAt: new Date(Date.now() + 4 * 86_400_000 + 2 * 3_600_000).toISOString(),
    locationType: 'in_person',
    location: 'HCMUS Campus 1 — Hall F102',
    url: null,
    isExam: true,
    preparationTaskId: null,
    recurrence: null,
    notes: 'Revise Taylor expansion and mean value theorem exercises.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-cs160-deadline',
    title: 'CS160 Programming Lab Assignment 2 Due',
    description: 'Submit source code and report for C++ pointer and memory allocation exercise.',
    category: 'deadline',
    startAt: new Date(Date.now() + 2 * 86_400_000).toISOString(),
    endAt: null,
    locationType: 'online',
    location: 'Moodle HCMUS',
    url: 'https://courses.fit.hcmus.edu.vn',
    isExam: false,
    preparationTaskId: null,
    recurrence: null,
    notes: 'Verify with valgrind for zero memory leaks before submitting.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-physics1-lecture',
    title: 'Physics I Problem Session',
    description: 'Classical mechanics, harmonic oscillation, and rotational dynamics.',
    category: 'school',
    startAt: new Date(Date.now() + 1 * 86_400_000 + 4 * 3_600_000).toISOString(),
    endAt: new Date(Date.now() + 1 * 86_400_000 + 6 * 3_600_000).toISOString(),
    locationType: 'in_person',
    location: 'Room B204',
    url: null,
    isExam: false,
    preparationTaskId: null,
    recurrence: { frequency: 'weekly', daysOfWeek: [2] },
    notes: 'Bring problem set chapter 4.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'evt-ai-sync',
    title: 'AI Engineering Weekly Study Sync',
    description: 'Discussing neural network backpropagation mathematics and PyTorch implementation.',
    category: 'meeting',
    startAt: new Date(Date.now() + 3 * 86_400_000 + 10 * 3_600_000).toISOString(),
    endAt: new Date(Date.now() + 3 * 86_400_000 + 11 * 3_600_000).toISOString(),
    locationType: 'online',
    location: 'Google Meet',
    url: 'https://meet.google.com',
    isExam: false,
    preparationTaskId: null,
    recurrence: { frequency: 'weekly', daysOfWeek: [5] },
    notes: 'Prepare notes from Chapter 3 of Deep Learning book.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export class EventService {
  private readonly store = new JsonFileStore<EventItem>('events.json', initialEvents);

  async listEvents(): Promise<EventItem[]> {
    const items = await this.store.getAll();
    return items.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  }

  async getEvent(id: string): Promise<EventItem | null> {
    return this.store.getById(id);
  }

  async createEvent(input: CreateEventInput): Promise<EventItem> {
    const validated = createEventInputSchema.parse(input);
    const nowIso = new Date().toISOString();
    const item: EventItem = {
      ...validated,
      id: crypto.randomUUID(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    return this.store.save(item);
  }

  async updateEvent(id: string, patch: Partial<CreateEventInput>): Promise<EventItem | null> {
    const existing = await this.store.getById(id);
    if (!existing) return null;
    const updated: EventItem = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    return this.store.save(updated);
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}

export const eventService = new EventService();
