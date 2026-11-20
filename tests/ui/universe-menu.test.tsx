// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UniverseMenu } from '@/ui/UniverseMenu';

const pushMock = vi.fn();

vi.mock('@/features/transitions/TransitionProvider', () => ({
  useTransitionRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
  }),
}));

describe('UniverseMenu frameless search and keyboard flow', () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders a frameless search input inside a dedicated focusable search row', () => {
    const onClose = vi.fn();
    const { container } = render(<UniverseMenu open onClose={onClose} />);

    const input = screen.getByRole('combobox');
    const row = container.querySelector('[data-frameless-search-row="true"]');

    expect(row).toBeInTheDocument();
    expect(row?.contains(input)).toBe(true);
    expect(input).toHaveAttribute('data-frameless-search', 'true');
    expect(input.className).toContain('border-0');
    expect(input.className).toContain('shadow-none');
    expect(input.className).not.toContain('border-transparent');

    const globalsCss = readFileSync(resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
    expect(globalsCss).toContain("[data-frameless-search='true']");
    expect(globalsCss).toContain("[data-frameless-search-row='true']:has([data-frameless-search='true']:focus-visible)");
  });

  it('filters spaces, supports arrow navigation + Enter selection, and dismisses on backdrop', () => {
    const onClose = vi.fn();
    render(<UniverseMenu open onClose={onClose} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Events' } });

    const option = screen.getByRole('option', { name: /Events/i });
    expect(option).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/events');
  });

  it('renders destinations as real links so Ctrl/Cmd+click opens a new tab without navigating in place', () => {
    const onClose = vi.fn();
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    render(<UniverseMenu open onClose={onClose} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Events' } });
    const option = screen.getByRole('option', { name: /Events/i });
    expect(option.tagName).toBe('A');
    expect(option).toHaveAttribute('href', '/events');

    fireEvent.click(option, { ctrlKey: true });
    expect(pushMock).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });
    expect(openSpy).toHaveBeenCalledWith('/events', '_blank', 'noopener');
    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.click(option);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/events');
  });

  it('keeps Tasks Hub available in the Universe menu', () => {
    const onClose = vi.fn();
    render(<UniverseMenu open onClose={onClose} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Tasks Hub' } });
    expect(screen.getByRole('option', { name: /Tasks Hub/i })).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    expect(pushMock).toHaveBeenCalledWith('/tasks/hub');
  });

  it('does not list hidden spaces', () => {
    render(<UniverseMenu open onClose={vi.fn()} />);

    const hrefs = screen.getAllByRole('option').map((option) => option.getAttribute('href'));
    for (const hidden of [
      '/ai-engineering',
      '/apcs',
      '/flashcards',
      '/entertainment',
      '/milestones',
      '/achievements',
    ]) {
      expect(hrefs).not.toContain(hidden);
    }
    expect(hrefs).toContain('/events');
  });

  it('includes Notifications inbox destination without altering FEATURE_REGISTRY', () => {
    const onClose = vi.fn();
    render(<UniverseMenu open onClose={onClose} />);

    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'Notifications' } });

    const option = screen.getByRole('option', { name: /Notifications/i });
    expect(option).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/notifications');
  });
});

