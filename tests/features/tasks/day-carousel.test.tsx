// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { DayCarousel } from '@/features/tasks/DayCarousel';

afterEach(cleanup);

function renderDays() {
  render(
    <DayCarousel
      boards={[
        { key: 'yesterday', label: 'Yesterday', content: <button>Yesterday task</button> },
        { key: 'today', label: 'Today', content: <button>Today task</button> },
        { key: 'tomorrow', label: 'Tomorrow', content: <button>Tomorrow task</button> },
      ]}
    />,
  );
}

it('moves the same boards between positions and exposes only valid controls', () => {
  renderDays();
  const today = screen.getByRole('button', { name: 'Today task' });
  const yesterday = screen.getByText('Yesterday task').parentElement;
  const tomorrow = screen.getByText('Tomorrow task').parentElement;
  expect(yesterday).toHaveAttribute('inert');
  expect(tomorrow).toHaveAttribute('inert');

  const previous = screen.getByRole('button', { name: 'Show Yesterday' });
  previous.focus();
  fireEvent.click(previous);
  expect(yesterday).toHaveAttribute('data-offset', '0');
  expect(today.parentElement).toHaveAttribute('data-offset', '1');
  expect(tomorrow).toHaveAttribute('data-offset', '2');
  expect(screen.queryByRole('button', { name: 'Show Yesterday' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Show Today' })).toHaveFocus();
  fireEvent.click(screen.getByRole('button', { name: 'Show Today' }));
  expect(screen.getByRole('button', { name: 'Today task' })).toBe(today);
  fireEvent.click(screen.getByRole('button', { name: 'Show Tomorrow' }));
  expect(tomorrow).toHaveAttribute('data-offset', '0');
  expect(today.parentElement).toHaveAttribute('data-offset', '-1');
  expect(yesterday).toHaveAttribute('data-offset', '-2');
  expect(screen.queryByRole('button', { name: 'Show Tomorrow' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Show Today' }));
  expect(today.parentElement).toHaveAttribute('data-offset', '0');
});

it('accepts arrows on the carousel but leaves task controls alone', () => {
  renderDays();
  const carousel = screen.getByRole('region', { name: 'Three-day task carousel' });
  fireEvent.keyDown(screen.getByRole('button', { name: 'Today task' }), { key: 'ArrowLeft' });
  expect(screen.getByRole('button', { name: 'Today task' })).toBeVisible();
  fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
  expect(screen.getByRole('button', { name: 'Yesterday task' })).toBeVisible();
  fireEvent.keyDown(carousel, { key: 'ArrowLeft' });
  expect(screen.getByRole('button', { name: 'Yesterday task' })).toBeVisible();
  fireEvent.keyDown(carousel, { key: 'ArrowRight' });
  expect(screen.getByRole('button', { name: 'Today task' })).toBeVisible();
});

it('moves one day per horizontal wheel gesture and preserves vertical scrolling', () => {
  renderDays();
  const carousel = screen.getByRole('region', { name: 'Three-day task carousel' });
  expect(fireEvent.wheel(carousel, { deltaY: 120 })).toBe(true);
  expect(screen.getByRole('button', { name: 'Today task' })).toBeVisible();
  expect(fireEvent.wheel(carousel, { deltaY: 84, shiftKey: true })).toBe(false);
  expect(screen.getByRole('button', { name: 'Tomorrow task' })).toBeVisible();
  fireEvent.wheel(carousel, { deltaX: -140 });
  expect(screen.getByRole('button', { name: 'Tomorrow task' })).toBeVisible();
});
