// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Checkbox } from '@/ui/Checkbox';
import { DatePickerField } from '@/ui/DatePickerField';
import { Dialog } from '@/ui/Dialog';
import { FeatureThemeProvider } from '@/ui/FeatureTheme';
import { FormattedNoteContent } from '@/ui/FormattedNoteContent';
import { LargeEditorDialog } from '@/ui/LargeEditorDialog';
import { RichNoteEditor } from '@/ui/RichNoteEditor';
import { SelectField } from '@/ui/SelectField';
import { TimeFieldControl } from '@/ui/TimeFieldControl';

describe('Milestone 1 shared notes editor & themed controls pilot', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders formatted notes safely without interpreting raw HTML tags', () => {
    render(
      <FormattedNoteContent
        value={'Review **architecture**\n\n- Check <script>alert(1)</script> item'}
      />,
    );

    const strongEl = screen.getByText('architecture');
    expect(strongEl.tagName).toBe('STRONG');
    expect(screen.getByText(/<script>alert\(1\)<\/script>/)).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });

  it('preserves untouched original note strings in RichNoteEditor without triggering onChange on mount', () => {
    const onChange = vi.fn();
    const legacyNote = '# Untouched Heading\n*keeps literal*';

    render(
      <RichNoteEditor
        id="test-editor"
        ariaLabel="Task description"
        value={legacyNote}
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('button', { name: 'Bold' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Bullet list' })).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('keeps SelectField popup themed inside nested Dialog and closes popup on Escape before Dialog', async () => {
    const onClose = vi.fn();

    function NestedPilot() {
      const [category, setCategory] = useState('academic');
      return (
        <FeatureThemeProvider name="events">
          <Dialog open onClose={onClose} title="Nested pilot dialog" portal>
            <SelectField
              id="nested-select"
              label="Event category"
              value={category}
              onChange={setCategory}
              options={[
                { value: 'academic', label: 'Academic' },
                { value: 'personal', label: 'Personal' },
              ]}
            />
          </Dialog>
        </FeatureThemeProvider>
      );
    }

    render(<NestedPilot />);

    const trigger = screen.getByRole('button', { name: /Event category/i });
    fireEvent.click(trigger);

    const listbox = screen.getByRole('listbox');
    const popupWrapper = listbox.closest('[data-overlay-popup="true"]');
    expect(popupWrapper).toHaveAttribute('data-theme', 'workspace');
    expect(popupWrapper).toHaveAttribute('data-feature-theme', 'events');

    // First Escape inside the open popup closes only SelectField, NOT the parent Dialog
    fireEvent.keyDown(listbox, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();

    // Second Escape closes the parent Dialog
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports typed task dates, ISO dates, 24h time values, and Checkbox labels', () => {
    const onDateChange = vi.fn();
    const onTimeChange = vi.fn();
    const onCheckedChange = vi.fn();

    render(
      <div data-feature-theme="tasks-hub">
        <DatePickerField
          id="task-date"
          mode="task"
          label="Deadline date"
          value="15/11"
          onChange={onDateChange}
        />
        <TimeFieldControl
          id="task-time"
          label="Deadline time"
          value="23:59"
          onChange={onTimeChange}
        />
        <Checkbox checked={false} onCheckedChange={onCheckedChange} label="Exam session" />
      </div>,
    );

    const dateInput = screen.getByLabelText('Deadline date') as HTMLInputElement;
    expect(dateInput.value).toBe('15/11');
    fireEvent.change(dateInput, { target: { value: '20/12/2026' } });
    expect(onDateChange).toHaveBeenCalledWith('20/12/2026');

    const timeInput = screen.getByLabelText('Deadline time') as HTMLInputElement;
    expect(timeInput.value).toBe('23:59');
    fireEvent.change(timeInput, { target: { value: '14:45' } });
    expect(onTimeChange).toHaveBeenCalledWith('14:45');

    fireEvent.click(screen.getByRole('checkbox', { name: 'Exam session' }));
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('awaits async onSaveDraft in LargeEditorDialog and renders equal-height 3-choice prompt', async () => {
    const onClose = vi.fn();
    const onSaveDraft = vi.fn(
      () =>
        new Promise<{ ok: true; message: string }>((resolve) => {
          setTimeout(() => resolve({ ok: true, message: 'Saved to server' }), 10);
        }),
    );

    render(
      <LargeEditorDialog
        open
        onClose={onClose}
        title="Edit event"
        formId="sample-form"
        isDirty
        submitLabel="Add to schedule"
        onSaveDraft={onSaveDraft}
      >
        <form id="sample-form" />
      </LargeEditorDialog>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close editor' }));

    const discardBtn = screen.getByRole('button', { name: 'Discard changes' });
    const continueBtn = screen.getByRole('button', { name: 'Continue editing' });
    const saveDraftBtn = screen.getByRole('button', { name: 'Save draft and close' });

    const gridContainer = discardBtn.closest('div');
    expect(gridContainer).toHaveClass('sm:grid-cols-3', 'items-stretch');
    expect(discardBtn).toHaveClass('w-full', 'h-full');
    expect(continueBtn).toHaveClass('w-full', 'h-full');
    expect(saveDraftBtn).toHaveClass('w-full', 'h-full');

    await act(async () => {
      fireEvent.click(saveDraftBtn);
    });

    await waitFor(() => {
      expect(onSaveDraft).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  it('keeps LargeEditorDialog open when async onSaveDraft returns ok: false', async () => {
    const onClose = vi.fn();
    const onSaveDraft = vi.fn(async () => ({
      ok: false as const,
      error: 'Could not reach server',
    }));

    render(
      <LargeEditorDialog
        open
        onClose={onClose}
        title="Edit event"
        formId="fail-form"
        isDirty
        submitLabel="Apply changes"
        onSaveDraft={onSaveDraft}
      >
        <form id="fail-form" />
      </LargeEditorDialog>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Close editor' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save draft and close' }));
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Could not reach server');
    });
    expect(onClose).not.toHaveBeenCalled();
  });
});
