// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventsPilotPrototype } from '@/features/events/pilot/EventsPilotPrototype';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/preview/events-pilot',
}));

describe('EventsPilotPrototype interactive fixture pilot', () => {
  const fetchSpy = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchSpy);
    fetchSpy.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('renders Aquatic Agenda upcoming horizon and never touches live network APIs', () => {
    render(<EventsPilotPrototype />);

    expect(screen.getByRole('heading', { name: /Events\s*&\s*exams/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Upcoming' })).toHaveAttribute('aria-selected', 'true');

    const agendaList = screen.getByRole('list', { name: 'Events agenda' });
    const titles = within(agendaList)
      .getAllByRole('heading', { level: 3 })
      .map((el) => el.textContent);

    expect(titles).toEqual([
      'AI Study Sync',
      'Calculus I Midterm',
      'Graph Algorithms Lab Checkout',
      'Linear Algebra Oral Check',
      'Advisor Feedback Hour',
      'Capstone Proposal Submission',
      'Winter Symposium Registration Lock',
    ]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('supports Past (newest first) and coordinated Week calendar navigation', () => {
    render(<EventsPilotPrototype />);

    fireEvent.click(screen.getByRole('tab', { name: 'Past' }));
    const pastTitles = within(screen.getByRole('list', { name: 'Events agenda' }))
      .getAllByRole('heading', { level: 3 })
      .map((el) => el.textContent);
    expect(pastTitles).toEqual(['Systems Debugging Workshop', 'Probability Diagnostic Quiz']);

    fireEvent.click(screen.getByRole('button', { name: /Mon, Nov 16, 2026/ }));
    fireEvent.click(screen.getByRole('tab', { name: 'Week calendar' }));
    expect(screen.getByText('Nov 16 – Nov 22')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Next week' }));
    expect(screen.getByText('Nov 23 – Nov 29')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Today' })[0]!);
    expect(screen.getByText('Nov 9 – Nov 15')).toBeInTheDocument();
  });

  it('filters by calendar day + category, resets day on Upcoming, and handles cross-year & leap Feb months', () => {
    render(<EventsPilotPrototype />);

    fireEvent.click(screen.getByRole('button', { name: /Thu, Nov 19, 2026/ }));
    expect(screen.getByText('Showing events for Thu, Nov 19, 2026')).toBeInTheDocument();
    const agendaList = screen.getByRole('list', { name: 'Events agenda' });
    expect(within(agendaList).getAllByRole('heading', { level: 3 }).map((el) => el.textContent)).toEqual([
      'Linear Algebra Oral Check',
      'Advisor Feedback Hour',
    ]);

    fireEvent.click(screen.getByRole('tab', { name: 'Exams' }));
    expect(within(agendaList).getAllByRole('heading', { level: 3 }).map((el) => el.textContent)).toEqual([
      'Linear Algebra Oral Check',
    ]);

    fireEvent.click(screen.getByRole('tab', { name: 'Upcoming' }));
    expect(screen.queryByText('Showing events for Thu, Nov 19, 2026')).not.toBeInTheDocument();

    // Cross-year forward (Nov 2026 -> Jan 2027) and leap-year Feb check (Feb 2024 has Feb 29)
    const nextMonthBtn = screen.getByRole('button', { name: 'Next month' });
    fireEvent.click(nextMonthBtn);
    fireEvent.click(nextMonthBtn);
    expect(screen.getByRole('heading', { name: 'January 2027' })).toBeInTheDocument();

    const prevMonthBtn = screen.getByRole('button', { name: 'Previous month' });
    for (let i = 0; i < 35; i += 1) {
      fireEvent.click(prevMonthBtn);
    }
    expect(screen.getByRole('heading', { name: 'February 2024' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Thu, Feb 29, 2024/ })).toBeInTheDocument();
  });

  it('swaps supporting pane for Event Detail on desktop and restores calendar cleanly', () => {
    render(<EventsPilotPrototype />);

    fireEvent.click(screen.getAllByRole('button', { name: /Calculus I Midterm/ })[0]!);
    expect(screen.queryByRole('grid')).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Events agenda' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to calendar' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Back to calendar' }));
    expect(screen.getByRole('grid')).toBeInTheDocument();
  });

  it('guards dirty edits with a 3-choice close prompt and offers fixture draft recovery', async () => {
    render(<EventsPilotPrototype />);

    // Clean close skips prompt
    fireEvent.click(screen.getByRole('button', { name: 'New event' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close event editor' }));
    expect(screen.queryByRole('dialog', { name: 'New event' })).not.toBeInTheDocument();

    // Dirty close opens prompt -> save draft -> resume on reopen
    fireEvent.click(screen.getByRole('button', { name: 'New event' }));
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Harbor Check-In' } });
    fireEvent.click(screen.getByRole('button', { name: 'Close event editor' }));

    expect(screen.getByRole('dialog', { name: 'Save edits before closing?' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save draft and close' }));
    expect(screen.queryByRole('dialog', { name: 'New event' })).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'Save edits before closing?' }),
      ).not.toBeInTheDocument(),
    );

    fireEvent.click(screen.getByRole('button', { name: 'New event' }));
    expect(screen.getByRole('button', { name: 'Resume draft' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume draft' }));
    expect(screen.getByLabelText('Title')).toHaveValue('Harbor Check-In');
  });

  it('keeps Sakura Notifications scoped over Aquatic Events and handles Error recovery state', () => {
    const { container } = render(<EventsPilotPrototype />);

    const pageRoot = container.querySelector('[data-feature-theme="events"]');
    expect(pageRoot).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Preview Sakura Notifications over events page' }),
    );
    const notifDialog = screen.getByRole('dialog', { name: 'Notifications (Sakura overlay)' });
    expect(notifDialog).toHaveAttribute('data-feature-theme', 'notification');
    expect(pageRoot).toHaveAttribute('data-feature-theme', 'events');
    fireEvent.click(screen.getByRole('button', { name: 'Close preview' }));

    fireEvent.click(screen.getByRole('button', { name: 'Error' }));
    expect(screen.getByRole('alert')).toHaveTextContent(/Could not load your schedule right now/);
    fireEvent.click(screen.getByRole('button', { name: 'Retry loading fixtures' }));
    expect(screen.getByRole('list', { name: 'Events agenda' })).toBeInTheDocument();
  });
});
