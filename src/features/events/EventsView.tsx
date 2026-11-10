'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  GraduationCap,
  MapPin,
  Plus,
  Video,
  X,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { useEvents, useCreateEvent, useDeleteEvent } from '@/client/queries/events';
import type { EventCategory, EventItem } from '@/contracts/event';
import { computeEventStats, formatRelativeEventTime, getUpcomingExams } from '@/domain/event-domain';
import { DEFAULT_APP_TIMEZONE } from '@/domain/time';
import { Button } from '@/ui/Button';
import styles from './events.module.css';

export function EventsView() {
  const { data: events = [], isLoading } = useEvents();
  const createMutation = useCreateEvent();
  const deleteMutation = useDeleteEvent();

  const [activeFilter, setActiveFilter] = useState<'all' | EventCategory>('all');
  const [viewMode, setViewMode] = useState<'list' | 'week'>('list');
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Clock without seconds in Asia/Ho_Chi_Minh
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-US', {
        timeZone: DEFAULT_APP_TIMEZONE,
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now);
      setCurrentTime(formatted);
    };
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedEvent(null);
        setIsCreateOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const stats = useMemo(() => computeEventStats(events), [events]);
  const upcomingExams = useMemo(() => getUpcomingExams(events), [events]);

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') return events;
    return events.filter((e) => e.category === activeFilter || (activeFilter === 'exam' && e.isExam));
  }, [events, activeFilter]);

  // Form state for creating an event
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<EventCategory>('school');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('09:00');
  const [newLocation, setNewLocation] = useState('');
  const [newIsOnline, setNewIsOnline] = useState(false);
  const [newIsExam, setNewIsExam] = useState(false);
  const [newNotes, setNewNotes] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) return;
    const startIso = new Date(`${newDate}T${newTime}:00+07:00`).toISOString();
    createMutation.mutate(
      {
        title: newTitle.trim(),
        description: newNotes.trim() || null,
        category: newCategory,
        startAt: startIso,
        endAt: null,
        locationType: newIsOnline ? 'online' : 'in_person',
        location: newLocation.trim() || null,
        url: null,
        isExam: newIsExam || newCategory === 'exam',
        notes: newNotes.trim() || null,
      },
      {
        onSuccess: () => {
          setIsCreateOpen(false);
          setNewTitle('');
          setNewLocation('');
          setNewNotes('');
        },
      },
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.forestGlow} aria-hidden="true" />

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <div className={styles.eyebrow}>
            <CalendarIcon size={16} />
            <span>Schedule & Milestones</span>
          </div>
          <h1 className={styles.title}>Events & Exams</h1>
        </div>
        <div className="flex items-center gap-3">
          {currentTime && (
            <div className={styles.dateClock}>
              <Clock size={15} className="text-status-optional" />
              <span>{currentTime}</span>
            </div>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            className="bg-status-optional hover:bg-status-done text-white"
          >
            <Plus size={16} className="mr-1" />
            <span>New event</span>
          </Button>
        </div>
      </header>

      {/* Overview Statistics */}
      <section className={styles.statsGrid} aria-label="Event statistics">
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.upcomingCount}</span>
          <span className={styles.statLabel}>Upcoming events</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{stats.thisWeekCount}</span>
          <span className={styles.statLabel}>Events this week</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue} style={{ color: 'var(--status-warn)' }}>
            {stats.approachingExamsCount}
          </span>
          <span className={styles.statLabel}>Approaching exams</span>
        </div>
      </section>

      {/* Upcoming Exams Spotlight */}
      {upcomingExams.length > 0 && (
        <section className={styles.examSection} aria-labelledby="exams-heading">
          <div className={styles.examHeader}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-status-warn" />
              <h2 id="exams-heading" className="font-semibold text-ws-text text-base">
                Upcoming examinations
              </h2>
            </div>
            <span className={styles.examBadge}>High priority</span>
          </div>
          <div className={styles.examCardsGrid}>
            {upcomingExams.map((exam) => (
              <div
                key={exam.id}
                className={styles.examCard}
                onClick={() => setSelectedEvent(exam)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setSelectedEvent(exam)}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={styles.examCardTitle}>{exam.title}</span>
                  <span className={styles.examCountdown}>
                    <Clock size={13} />
                    {formatRelativeEventTime(exam.startAt)}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-ws-text-muted">
                  {exam.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin size={13} />
                      {exam.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <BookOpen size={13} />
                    {new Intl.DateTimeFormat('en-US', {
                      timeZone: DEFAULT_APP_TIMEZONE,
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(exam.startAt))}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Controls: Filter pills and View switch */}
      <div className={styles.controlsBar}>
        <div className={styles.filterTabs} role="tablist" aria-label="Event category filter">
          {(['all', 'exam', 'school', 'meeting', 'deadline'] as const).map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={activeFilter === cat}
              className={`${styles.filterTab} ${activeFilter === cat ? styles.filterTabActive : ''}`}
              onClick={() => setActiveFilter(cat)}
            >
              {cat === 'all'
                ? 'All'
                : cat === 'exam'
                  ? 'Exams'
                  : cat === 'school'
                    ? 'School'
                    : cat === 'meeting'
                      ? 'Meetings'
                      : 'Deadlines'}
            </button>
          ))}
        </div>

        <div className="inline-flex items-center gap-1 p-1 rounded-pill bg-ws-bg-alt border border-ws-border">
          <button
            type="button"
            className={`px-3 py-1 text-xs font-medium rounded-pill transition-colors ${
              viewMode === 'list'
                ? 'bg-ws-surface text-ws-text shadow-sm'
                : 'text-ws-text-muted hover:text-ws-text'
            }`}
            onClick={() => setViewMode('list')}
          >
            Cards
          </button>
          <button
            type="button"
            className={`px-3 py-1 text-xs font-medium rounded-pill transition-colors ${
              viewMode === 'week'
                ? 'bg-ws-surface text-ws-text shadow-sm'
                : 'text-ws-text-muted hover:text-ws-text'
            }`}
            onClick={() => setViewMode('week')}
          >
            Week calendar
          </button>
        </div>
      </div>

      {/* Content: Cards View vs Week View */}
      {isLoading ? (
        <div className="py-16 text-center text-ws-text-muted">Loading events…</div>
      ) : viewMode === 'list' ? (
        <div className={styles.eventGrid}>
          {filteredEvents.length === 0 ? (
            <div className="col-span-full py-16 text-center text-ws-text-muted">
              No events in this category yet.
            </div>
          ) : (
            filteredEvents.map((event) => {
              const startDate = new Date(event.startAt);
              const formattedDate = new Intl.DateTimeFormat('en-US', {
                timeZone: DEFAULT_APP_TIMEZONE,
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }).format(startDate);
              const formattedTime = new Intl.DateTimeFormat('en-US', {
                timeZone: DEFAULT_APP_TIMEZONE,
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
              }).format(startDate);

              return (
                <article
                  key={event.id}
                  className={styles.eventCard}
                  onClick={() => setSelectedEvent(event)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && setSelectedEvent(event)}
                >
                  <div className={styles.eventCardTop}>
                    <div className={styles.eventCardBadgeRow}>
                      <span
                        className={`${styles.categoryTag} ${
                          styles[`categoryTag_${event.category}` as keyof typeof styles] ?? ''
                        }`}
                      >
                        {event.category === 'exam' ? (
                          <GraduationCap size={12} />
                        ) : event.category === 'meeting' ? (
                          <Video size={12} />
                        ) : event.category === 'deadline' ? (
                          <Clock size={12} />
                        ) : (
                          <CalendarIcon size={12} />
                        )}
                        <span>
                          {event.category === 'exam'
                            ? 'Exam'
                            : event.category === 'meeting'
                              ? 'Meeting'
                              : event.category === 'deadline'
                                ? 'Deadline'
                                : 'School'}
                        </span>
                      </span>

                      <span className="text-xs font-semibold text-ws-text-muted">
                        {formatRelativeEventTime(event.startAt)}
                      </span>
                    </div>

                    <h3 className={styles.eventCardTitle}>{event.title}</h3>
                  </div>

                  <div className={styles.eventCardMeta}>
                    <div className={styles.metaRow}>
                      <CalendarIcon size={14} className="text-ws-text-muted shrink-0" />
                      <span>
                        {formattedDate} · {formattedTime}
                      </span>
                    </div>

                    {event.location && (
                      <div className={styles.metaRow}>
                        {event.locationType === 'online' ? (
                          <Video size={14} className="text-ws-text-muted shrink-0" />
                        ) : (
                          <MapPin size={14} className="text-ws-text-muted shrink-0" />
                        )}
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })
          )}
        </div>
      ) : (
        /* Week Calendar View */
        <div className={styles.calendarViewContainer}>
          <div className="flex items-center justify-between pb-3 border-b border-ws-border">
            <h3 className="font-semibold text-ws-text">This week&apos;s schedule</h3>
            <span className="text-xs text-ws-text-muted">Monday – Sunday</span>
          </div>
          <div className={styles.weekGrid}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className={styles.dayColumn}>
                <div className={styles.dayHeader}>{day}</div>
                <div className="flex flex-col gap-2 flex-1">
                  {filteredEvents.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="p-1.5 rounded-sm bg-ws-surface border border-ws-border text-xs cursor-pointer hover:border-status-optional transition-colors"
                    >
                      <div className="font-medium text-ws-text truncate">{evt.title}</div>
                      <div className="text-[10px] text-ws-text-muted">
                        {new Intl.DateTimeFormat('en-US', {
                          timeZone: DEFAULT_APP_TIMEZONE,
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        }).format(new Date(evt.startAt))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event Details Centered Modal */}
      {selectedEvent && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setSelectedEvent(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalWindow} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={() => setSelectedEvent(null)}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col gap-3">
              <span
                className={`${styles.categoryTag} ${
                  styles[`categoryTag_${selectedEvent.category}` as keyof typeof styles] ?? ''
                } self-start`}
              >
                {selectedEvent.category}
              </span>
              <h2 className="font-display text-2xl font-semibold text-ws-text leading-tight">
                {selectedEvent.title}
              </h2>
            </div>

            <div className="flex flex-col gap-2.5 text-sm text-ws-text-muted border-y border-ws-border py-4">
              <div className="flex items-center gap-2 text-ws-text">
                <CalendarIcon size={16} className="text-status-optional" />
                <span>
                  {new Intl.DateTimeFormat('en-US', {
                    timeZone: DEFAULT_APP_TIMEZONE,
                    dateStyle: 'full',
                    timeStyle: 'short',
                  }).format(new Date(selectedEvent.startAt))}
                </span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{selectedEvent.location}</span>
                </div>
              )}
              {selectedEvent.isExam && (
                <div className="flex items-center gap-2 text-status-warn font-medium">
                  <AlertTriangle size={16} />
                  <span>High priority examination</span>
                </div>
              )}
            </div>

            {selectedEvent.description && (
              <div className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-ws-text">Notes & instructions</span>
                <p className="text-ws-text-muted whitespace-pre-wrap">
                  {selectedEvent.description}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-status-urgent hover:bg-status-urgent-soft"
                onClick={() => {
                  deleteMutation.mutate(selectedEvent.id);
                  setSelectedEvent(null);
                }}
              >
                Delete event
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal Dialog */}
      {isCreateOpen && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setIsCreateOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className={styles.modalWindow} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={() => setIsCreateOpen(false)}
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>

            <h2 className="font-display text-2xl font-semibold text-ws-text">Add new event</h2>

            <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ws-text">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Calculus I Midterm or Project Sync"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none focus:border-status-optional"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ws-text">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as EventCategory)}
                    className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none focus:border-status-optional"
                  >
                    <option value="school">School</option>
                    <option value="exam">Exam</option>
                    <option value="meeting">Meeting</option>
                    <option value="deadline">Deadline</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ws-text">Date</label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none focus:border-status-optional"
                  >
                  </input>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ws-text">Time</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none focus:border-status-optional"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-ws-text">Location</label>
                  <input
                    type="text"
                    placeholder="Room or link"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none focus:border-status-optional"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 py-1">
                <label className="inline-flex items-center gap-2 text-xs text-ws-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsOnline}
                    onChange={(e) => setNewIsOnline(e.target.checked)}
                    className="rounded border-ws-border text-status-optional"
                  />
                  <span>Online meeting</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs text-ws-text cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newIsExam}
                    onChange={(e) => setNewIsExam(e.target.checked)}
                    className="rounded border-ws-border text-status-warn"
                  />
                  <span>Mark as examination</span>
                </label>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-ws-text">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Preparation notes, requirements, or agenda…"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="px-3 py-2 rounded-sm bg-ws-bg border border-ws-border text-sm text-ws-text focus:outline-none focus:border-status-optional resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={createMutation.isPending}
                  className="bg-status-optional hover:bg-status-done text-white"
                >
                  Create event
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

