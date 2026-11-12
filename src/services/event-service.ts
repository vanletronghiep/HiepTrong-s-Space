import { ValidationError } from './errors';
import { eventItemSchema, createEventInputSchema, type CreateEventInput, type EventItem } from '@/contracts/event';
import { JsonFileStore } from './storage/json-store';

export class EventService {
  private readonly store = new JsonFileStore<EventItem>('events.json');

  async listEvents(): Promise<EventItem[]> {
    const items = await this.store.getAll();
    for (const item of items) eventItemSchema.parse(item);
    return items.sort((a, b) => Date.parse(a.startAt) - Date.parse(b.startAt));
  }

  async getEvent(id: string): Promise<EventItem | null> {
    return this.store.getById(id);
  }

  async createEvent(input: CreateEventInput): Promise<EventItem> {
    const validated = createEventInputSchema.parse(input);
    if (validated.endAt && Date.parse(validated.endAt) < Date.parse(validated.startAt)) throw new ValidationError('End must not precede start', { endAt: 'Choose an end after start' });
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
    return this.store.modify(id, (existing) => {
      const updated: EventItem = {
        ...existing,
        ...createEventInputSchema.parse({ ...existing, ...patch }),
        updatedAt: new Date().toISOString(),
      };
      if (updated.endAt && Date.parse(updated.endAt) < Date.parse(updated.startAt)) throw new ValidationError('End must not precede start');
      return updated;
    });
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}

export const eventService = new EventService();
