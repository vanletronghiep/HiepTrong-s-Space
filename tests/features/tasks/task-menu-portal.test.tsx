// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { TaskMenu } from '@/features/tasks/shared/TaskMenu';
import type { TaskDto } from '@/contracts';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

it('opens outside transformed cards, clamps at viewport edges, and closes when its day becomes inactive', async () => {
  const task = { id: 'task', title: 'Menu task', scheduledDate: null } as TaskDto;
  const noop = () => {};
  const width = vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(375);
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800);
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(260);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 754,
    bottom: 790,
    left: 334,
    right: 370,
    width: 36,
    height: 36,
    x: 334,
    y: 754,
    toJSON: () => {},
  });
  const { container } = render(
    <div data-day="today" style={{ transform: 'translateX(20px)' }}>
      <div aria-hidden="false">
        <TaskMenu
          task={task}
          context="hub"
          portal
          now={new Date()}
          isOverdue={false}
          onEdit={noop}
          onScheduleDate={noop}
          onOpenPickDate={noop}
          onOpenTransfer={noop}
          onRequestDelete={noop}
        />
      </div>
    </div>,
  );
  const trigger = screen.getByRole('button', { name: 'Actions for Menu task' });
  fireEvent.click(trigger);
  const menu = screen.getByRole('dialog', { name: 'Menu for Menu task' });
  expect(container.contains(menu)).toBe(false);
  expect(menu).toHaveStyle({ position: 'fixed', left: '139px', top: '486px' });
  width.mockReturnValue(320);
  fireEvent(window, new Event('resize'));
  expect(menu).toHaveStyle({ left: '84px' });
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  expect(trigger).toHaveFocus();
  fireEvent.click(trigger);
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  const content = container.querySelector('[aria-hidden]')!;
  content.setAttribute('inert', '');
  content.setAttribute('aria-hidden', 'true');
  await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
});
