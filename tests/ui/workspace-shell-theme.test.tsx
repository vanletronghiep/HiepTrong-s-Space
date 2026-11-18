// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ToastProvider } from '@/ui/Toast';
import { WorkspaceShell } from '@/ui/WorkspaceShell';

let mockedPathname = '/events';
const transitionPush = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockedPathname,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock('@/client/queries/notifications', () => ({
  useNotifications: () => ({
    data: { items: [], unreadCount: 0 },
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  }),
  useSetNotificationRead: () => ({ mutate: vi.fn(), isPending: false }),
  useMarkAllNotificationsRead: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/features/transitions/TransitionProvider', () => ({
  useTransitionRouter: () => ({
    push: transitionPush,
    replace: vi.fn(),
    isTransitioning: false,
  }),
}));

vi.mock('@/features/tasks/DailyDashboard', () => ({
  DailyHeaderDate: () => <span>Daily date</span>,
}));

vi.mock('@/features/tasks/DailySky', () => ({
  DailySky: () => <div data-testid="daily-sky" />,
  OrbitPlanetIcon: () => <svg aria-hidden="true" />,
}));

describe('WorkspaceShell full-page feature theme & overlay isolation', () => {
  beforeEach(() => {
    mockedPathname = '/events';
    transitionPush.mockClear();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it.each([
    ['/tasks/daily', 'Tasks Hub', '/tasks/hub'],
    ['/tasks/hub', 'Daily', '/tasks/daily'],
  ])('places the %s shortcut in the topbar and navigates to %s', (pathname, label, href) => {
    mockedPathname = pathname;
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell><div>Task content</div></WorkspaceShell>
      </ToastProvider>,
    );
    const shortcut = screen.getByRole('link', { name: label });
    const header = container.querySelector('header')!;
    expect(header).toContainElement(shortcut);
    expect(container.querySelector('main')).not.toContainElement(shortcut);
    expect(shortcut).toHaveAttribute('href', href);
    expect(shortcut.nextElementSibling).toBe(
      pathname === '/tasks/daily'
        ? screen.getByText('Daily date')
        : screen.getByRole('button', { name: 'Open universe menu' }),
    );
    fireEvent.click(shortcut);
    expect(transitionPush).toHaveBeenCalledWith(href);
  });

  it.each(['/events', '/tracking', '/notifications'])('omits task shortcuts on %s', (pathname) => {
    mockedPathname = pathname;
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell><div>Feature content</div></WorkspaceShell>
      </ToastProvider>,
    );
    expect(container.querySelector('[data-task-shortcut]')).not.toBeInTheDocument();
  });

  it('extends events palette to workspace shell and Universe menu while keeping Notifications sakura', () => {
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell>
          <div>Events content</div>
        </WorkspaceShell>
      </ToastProvider>,
    );

    const shellRoot = container.firstElementChild as HTMLElement;
    expect(shellRoot).toHaveAttribute('data-theme', 'workspace');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'events');
    expect(shellRoot).toHaveAttribute('data-fullpage-theme', 'true');

    // Topbar sits inside full-page themed wrapper and excludes boxed FeatureTheme wrapper
    expect(container.querySelector('[data-fullpage-topbar="true"]')).toBeInTheDocument();
    expect(container.querySelector('main > [data-feature-theme="events"]')).toBeNull();

    // Universe menu inherits events theme when opened
    fireEvent.click(screen.getByRole('button', { name: 'Open universe menu' }));
    const universeDialog = screen.getByRole('dialog', { name: 'Universe menu' });
    expect(universeDialog).toHaveAttribute('data-feature-theme', 'events');

    // Notifications popover always stays sakura without recoloring the shell
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const notifDialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(notifDialog).toHaveAttribute('data-feature-theme', 'notification');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'events');
  });

  it('renders /tasks/hub as an open full-page theme without the bordered FeatureTheme frame (v3.2)', () => {
    mockedPathname = '/tasks/hub';
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell>
          <div>Hub content</div>
        </WorkspaceShell>
      </ToastProvider>,
    );

    const shellRoot = container.firstElementChild as HTMLElement;
    expect(shellRoot).toHaveAttribute('data-fullpage-theme', 'true');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'tasks-hub');
    expect(container.querySelector('main [data-feature-theme="tasks-hub"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open universe menu' }));
    expect(screen.getByRole('dialog', { name: 'Universe menu' })).toHaveAttribute(
      'data-feature-theme',
      'tasks-hub',
    );
  });

  it('extends sakura notification palette across full-page /notifications shell and Universe menu', () => {
    mockedPathname = '/notifications';
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell>
          <div>Notifications center</div>
        </WorkspaceShell>
      </ToastProvider>,
    );

    const shellRoot = container.firstElementChild as HTMLElement;
    expect(shellRoot).toHaveAttribute('data-theme', 'workspace');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'notification');
    expect(shellRoot).toHaveAttribute('data-fullpage-theme', 'true');
    expect(container.querySelector('[data-fullpage-topbar="true"]')).toBeInTheDocument();
    expect(container.querySelector('main > [data-feature-theme="notification"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open universe menu' }));
    expect(screen.getByRole('dialog', { name: 'Universe menu' })).toHaveAttribute(
      'data-feature-theme',
      'notification',
    );
  });

  it('extends tracking Herbal Tea Sanctuary palette across shell and Universe menu while keeping Notifications sakura', () => {
    mockedPathname = '/tracking';
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell>
          <div>Tracking sanctuary</div>
        </WorkspaceShell>
      </ToastProvider>,
    );

    const shellRoot = container.firstElementChild as HTMLElement;
    expect(shellRoot).toHaveAttribute('data-theme', 'workspace');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'tracking');
    expect(shellRoot).toHaveAttribute('data-fullpage-theme', 'true');
    expect(container.querySelector('[data-fullpage-topbar="true"]')).toBeInTheDocument();
    expect(container.querySelector('main > [data-feature-theme="tracking"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open universe menu' }));
    expect(screen.getByRole('dialog', { name: 'Universe menu' })).toHaveAttribute(
      'data-feature-theme',
      'tracking',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const notifDialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(notifDialog).toHaveAttribute('data-feature-theme', 'notification');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'tracking');
  });

  it('extends ai-engineering Mist Trail palette across shell and Universe menu while keeping Notifications sakura', () => {
    mockedPathname = '/ai-engineering';
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell>
          <div>AI Engineering Mist Trail</div>
        </WorkspaceShell>
      </ToastProvider>,
    );

    const shellRoot = container.firstElementChild as HTMLElement;
    expect(shellRoot).toHaveAttribute('data-theme', 'workspace');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'ai-engineering');
    expect(shellRoot).toHaveAttribute('data-fullpage-theme', 'true');
    expect(container.querySelector('[data-fullpage-topbar="true"]')).toBeInTheDocument();
    expect(container.querySelector('main > [data-feature-theme="ai-engineering"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open universe menu' }));
    expect(screen.getByRole('dialog', { name: 'Universe menu' })).toHaveAttribute(
      'data-feature-theme',
      'ai-engineering',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const notifDialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(notifDialog).toHaveAttribute('data-feature-theme', 'notification');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'ai-engineering');
  });

  it('extends apcs-hub Winter Library palette across shell and Universe menu while keeping Notifications sakura', () => {
    mockedPathname = '/apcs';
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell>
          <div>APCS Winter Library</div>
        </WorkspaceShell>
      </ToastProvider>,
    );

    const shellRoot = container.firstElementChild as HTMLElement;
    expect(shellRoot).toHaveAttribute('data-theme', 'workspace');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'apcs-hub');
    expect(shellRoot).toHaveAttribute('data-fullpage-theme', 'true');
    expect(container.querySelector('[data-fullpage-topbar="true"]')).toBeInTheDocument();
    expect(container.querySelector('main > [data-feature-theme="apcs-hub"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open universe menu' }));
    expect(screen.getByRole('dialog', { name: 'Universe menu' })).toHaveAttribute(
      'data-feature-theme',
      'apcs-hub',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const notifDialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(notifDialog).toHaveAttribute('data-feature-theme', 'notification');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'apcs-hub');
  });

  it('extends flashcards Vintage Reading Room palette across shell and Universe menu while keeping Notifications sakura', () => {
    mockedPathname = '/flashcards';
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell>
          <div>Flashcards Reading Room</div>
        </WorkspaceShell>
      </ToastProvider>,
    );

    const shellRoot = container.firstElementChild as HTMLElement;
    expect(shellRoot).toHaveAttribute('data-theme', 'workspace');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'flashcards');
    expect(shellRoot).toHaveAttribute('data-fullpage-theme', 'true');
    expect(container.querySelector('[data-fullpage-topbar="true"]')).toBeInTheDocument();
    expect(container.querySelector('main > [data-feature-theme="flashcards"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open universe menu' }));
    expect(screen.getByRole('dialog', { name: 'Universe menu' })).toHaveAttribute(
      'data-feature-theme',
      'flashcards',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const notifDialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(notifDialog).toHaveAttribute('data-feature-theme', 'notification');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'flashcards');
  });

  it('extends learning-room Bonsai Timer Sanctuary palette across shell and Universe menu while keeping Notifications sakura', () => {
    mockedPathname = '/learning-room';
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell>
          <div>Learning Room Sanctuary</div>
        </WorkspaceShell>
      </ToastProvider>,
    );

    const shellRoot = container.firstElementChild as HTMLElement;
    expect(shellRoot).toHaveAttribute('data-theme', 'workspace');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'learning-room');
    expect(shellRoot).toHaveAttribute('data-fullpage-theme', 'true');
    expect(container.querySelector('[data-fullpage-topbar="true"]')).toBeInTheDocument();
    expect(container.querySelector('main > [data-feature-theme="learning-room"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open universe menu' }));
    expect(screen.getByRole('dialog', { name: 'Universe menu' })).toHaveAttribute(
      'data-feature-theme',
      'learning-room',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const notifDialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(notifDialog).toHaveAttribute('data-feature-theme', 'notification');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'learning-room');
  });

  it('extends blogs-hub Editorial Woodland palette across shell and Universe menu while keeping Notifications sakura', () => {
    mockedPathname = '/blogs';
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell>
          <div>Blogs Writing Room</div>
        </WorkspaceShell>
      </ToastProvider>,
    );

    const shellRoot = container.firstElementChild as HTMLElement;
    expect(shellRoot).toHaveAttribute('data-theme', 'workspace');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'blogs-hub');
    expect(shellRoot).toHaveAttribute('data-fullpage-theme', 'true');
    expect(container.querySelector('[data-fullpage-topbar="true"]')).toBeInTheDocument();
    expect(container.querySelector('main > [data-feature-theme="blogs-hub"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open universe menu' }));
    expect(screen.getByRole('dialog', { name: 'Universe menu' })).toHaveAttribute(
      'data-feature-theme',
      'blogs-hub',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const notifDialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(notifDialog).toHaveAttribute('data-feature-theme', 'notification');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'blogs-hub');
  });

  it('extends entertainment-hub Lounge palette across shell and Universe menu while keeping Notifications sakura', () => {
    mockedPathname = '/entertainment';
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell>
          <div>Entertainment Lounge</div>
        </WorkspaceShell>
      </ToastProvider>,
    );

    const shellRoot = container.firstElementChild as HTMLElement;
    expect(shellRoot).toHaveAttribute('data-theme', 'workspace');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'entertainment-hub');
    expect(shellRoot).toHaveAttribute('data-fullpage-theme', 'true');
    expect(container.querySelector('[data-fullpage-topbar="true"]')).toBeInTheDocument();
    expect(container.querySelector('main > [data-feature-theme="entertainment-hub"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open universe menu' }));
    expect(screen.getByRole('dialog', { name: 'Universe menu' })).toHaveAttribute(
      'data-feature-theme',
      'entertainment-hub',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const notifDialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(notifDialog).toHaveAttribute('data-feature-theme', 'notification');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'entertainment-hub');
  });

  it('extends project Eastern Strategy palette across shell and Universe menu while keeping Notifications sakura', () => {
    mockedPathname = '/projects';
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell>
          <div>Projects Eastern Strategy Workspace</div>
        </WorkspaceShell>
      </ToastProvider>,
    );

    const shellRoot = container.firstElementChild as HTMLElement;
    expect(shellRoot).toHaveAttribute('data-theme', 'workspace');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'project');
    expect(shellRoot).toHaveAttribute('data-fullpage-theme', 'true');
    expect(container.querySelector('[data-fullpage-topbar="true"]')).toBeInTheDocument();
    expect(container.querySelector('main > [data-feature-theme="project"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open universe menu' }));
    expect(screen.getByRole('dialog', { name: 'Universe menu' })).toHaveAttribute(
      'data-feature-theme',
      'project',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const notifDialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(notifDialog).toHaveAttribute('data-feature-theme', 'notification');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'project');
  });

  it('extends annual-milestones Yearbook palette across shell and Universe menu while keeping Notifications sakura', () => {
    mockedPathname = '/milestones';
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell>
          <div>Annual Milestones Yearbook</div>
        </WorkspaceShell>
      </ToastProvider>,
    );

    const shellRoot = container.firstElementChild as HTMLElement;
    expect(shellRoot).toHaveAttribute('data-theme', 'workspace');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'annual-milestones');
    expect(shellRoot).toHaveAttribute('data-fullpage-theme', 'true');
    expect(container.querySelector('[data-fullpage-topbar="true"]')).toBeInTheDocument();
    expect(container.querySelector('main > [data-feature-theme="annual-milestones"]')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open universe menu' }));
    expect(screen.getByRole('dialog', { name: 'Universe menu' })).toHaveAttribute(
      'data-feature-theme',
      'annual-milestones',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const notifDialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(notifDialog).toHaveAttribute('data-feature-theme', 'notification');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'annual-milestones');
  });

  it('extends personal-achievements Roman Marble Gallery palette across shell and Universe menu while keeping Notifications sakura', () => {
    mockedPathname = '/achievements';
    const { container } = render(
      <ToastProvider>
        <WorkspaceShell>
          <div>Personal Achievements Gallery</div>
        </WorkspaceShell>
      </ToastProvider>,
    );

    const shellRoot = container.firstElementChild as HTMLElement;
    expect(shellRoot).toHaveAttribute('data-theme', 'workspace');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'personal-achievements');
    expect(shellRoot).toHaveAttribute('data-fullpage-theme', 'true');
    expect(container.querySelector('[data-fullpage-topbar="true"]')).toBeInTheDocument();
    expect(
      container.querySelector('main > [data-feature-theme="personal-achievements"]'),
    ).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Open universe menu' }));
    expect(screen.getByRole('dialog', { name: 'Universe menu' })).toHaveAttribute(
      'data-feature-theme',
      'personal-achievements',
    );

    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    const notifDialog = screen.getByRole('dialog', { name: 'Notifications' });
    expect(notifDialog).toHaveAttribute('data-feature-theme', 'notification');
    expect(shellRoot).toHaveAttribute('data-feature-theme', 'personal-achievements');
  });
});
