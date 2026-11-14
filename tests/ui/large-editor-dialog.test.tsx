// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TransitionLink } from '@/features/transitions/TransitionLink';
import { TransitionProvider } from '@/features/transitions/TransitionProvider';
import { FeatureThemeProvider } from '@/ui/FeatureTheme';
import { LargeEditorDialog, type DraftSaveOutcome } from '@/ui/LargeEditorDialog';
import { ToastProvider } from '@/ui/Toast';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
  }),
  usePathname: () => '/events',
}));

function renderEditor(props: {
  open?: boolean;
  isDirty?: boolean;
  onClose?: () => void;
  onSaveDraft?: () => DraftSaveOutcome;
  onDiscardChanges?: () => void;
  draftRecovery?: {
    savedAtLabel: string;
    stale?: boolean;
    onResume: () => void;
    onDiscard: () => void;
  } | null;
}) {
  const onClose = props.onClose ?? vi.fn();
  const rendered = render(
    <ToastProvider>
      <TransitionProvider>
        <TransitionLink href="/tasks/hub">Go to Hub</TransitionLink>
        <FeatureThemeProvider name="events">
          <LargeEditorDialog
            open={props.open ?? true}
            onClose={onClose}
            title="New event"
            formId="sample-editor-form"
            isDirty={props.isDirty ?? false}
            submitLabel="Create event"
            onSaveDraft={props.onSaveDraft ?? (() => ({ ok: true }))}
            onDiscardChanges={props.onDiscardChanges}
            draftRecovery={props.draftRecovery ?? null}
          >
            <form id="sample-editor-form">
              <label htmlFor="sample-title">Title</label>
              <input id="sample-title" type="text" defaultValue="" />
            </form>
          </LargeEditorDialog>
        </FeatureThemeProvider>
      </TransitionProvider>
    </ToastProvider>,
  );
  return { ...rendered, onClose };
}

describe('LargeEditorDialog closing, draft saving, and navigation guard', () => {
  beforeEach(() => {
    pushMock.mockReset();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('closes immediately when unchanged', () => {
    const onClose = vi.fn();
    renderEditor({ isDirty: false, onClose });

    fireEvent.click(screen.getByRole('button', { name: 'Close editor' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Save changes before closing?' })).toBeNull();
  });

  it('prompts three choices on dirty Escape/X and supports Continue, Discard, and Save draft and close', async () => {
    const onClose = vi.fn();
    const onSaveDraft = vi.fn(() => ({ ok: true as const }));
    const onDiscardChanges = vi.fn();

    renderEditor({ isDirty: true, onClose, onSaveDraft, onDiscardChanges });

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(
      screen.getByRole('dialog', { name: 'Save changes before closing?' }),
    ).toBeInTheDocument();

    // Continue editing keeps editor open
    fireEvent.click(screen.getByRole('button', { name: 'Continue editing' }));
    expect(onClose).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Save changes before closing?' })).toBeNull(),
    );

    // Trigger again and choose Save draft and close
    fireEvent.click(screen.getByRole('button', { name: 'Close editor' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save draft and close' }));
    expect(onSaveDraft).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('guards in-app navigation when dirty and completes navigation only after Discard or Save draft', () => {
    const onClose = vi.fn();
    const onSaveDraft = vi.fn(() => ({ ok: true as const }));
    const onDiscardChanges = vi.fn();

    renderEditor({ isDirty: true, onClose, onSaveDraft, onDiscardChanges });

    fireEvent.click(screen.getByRole('link', { name: 'Go to Hub' }));
    expect(pushMock).not.toHaveBeenCalled();
    expect(
      screen.getByRole('dialog', { name: 'Save changes before closing?' }),
    ).toBeInTheDocument();

    // Cancel navigation first
    fireEvent.click(screen.getByRole('button', { name: 'Continue editing' }));
    expect(pushMock).not.toHaveBeenCalled();

    // Try navigating again and discard changes
    fireEvent.click(screen.getByRole('link', { name: 'Go to Hub' }));
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }));
    expect(onDiscardChanges).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith('/tasks/hub');
  });

  it('keeps user open and displays role="alert" if draft saving fails on close confirmation', () => {
    const onClose = vi.fn();
    const onSaveDraft = vi.fn(() => ({
      ok: false as const,
      error: 'Storage quota exceeded.',
    }));

    renderEditor({ isDirty: true, onClose, onSaveDraft });

    fireEvent.click(screen.getByRole('link', { name: 'Go to Hub' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save draft and close' }));

    expect(onSaveDraft).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent('Storage quota exceeded.');
  });

  it('renders draft recovery banner with stale warning and actions', () => {
    const onResume = vi.fn();
    const onDiscard = vi.fn();

    renderEditor({
      draftRecovery: {
        savedAtLabel: 'Nov 13, 10:00',
        stale: true,
        onResume,
        onDiscard,
      },
    });

    expect(screen.getByText(/Local draft saved Nov 13, 10:00/)).toBeInTheDocument();
    expect(
      screen.getByText(/This item was updated after your local draft was saved/),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Resume draft' }));
    expect(onResume).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});

