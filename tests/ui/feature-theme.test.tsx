// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { FeatureThemeProvider } from '@/ui/FeatureTheme';
import { Dialog } from '@/ui/Dialog';
import { taskNoteTone } from '@/features/tasks/shared/task-note-tone';

afterEach(cleanup);

it('explicitly scopes a portaled feature dialog and leaves neighboring shared controls unthemed', () => {
  const { container } = render(
    <>
      <button>Shared navigation</button>
      <FeatureThemeProvider name="events">
        <Dialog open portal onClose={() => {}} title="Edit event">
          <input aria-label="Title" />
        </Dialog>
      </FeatureThemeProvider>
    </>,
  );
  const dialog = screen.getByRole('dialog', { name: 'Edit event' });
  expect(dialog).toHaveAttribute('data-feature-theme', 'events');
  expect(dialog).toHaveAttribute('data-theme', 'workspace');
  expect(container.contains(dialog)).toBe(false);
  expect(
    screen.getByRole('button', { name: 'Shared navigation' }).closest('[data-feature-theme]'),
  ).toBeNull();
});

it('derives task colors from identity independently of order and covers all six families', () => {
  const ids = Array.from({ length: 30 }, (_, i) => `task-${i}`);
  const initial = new Map(ids.map((id) => [id, taskNoteTone(id)]));
  for (const id of ids.reverse()) expect(taskNoteTone(id)).toBe(initial.get(id));
  expect(new Set(initial.values()).size).toBe(6);
});
