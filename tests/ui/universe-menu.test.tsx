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

