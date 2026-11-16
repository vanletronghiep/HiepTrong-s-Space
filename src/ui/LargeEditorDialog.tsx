'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { createPortal } from 'react-dom';
import { MOTION_DURATION, MOTION_EASE } from '@/design/motion';
import { useNavigationGuard } from '@/features/transitions/TransitionProvider';
import { Button } from './Button';
import { cn } from './cn';
import { Dialog } from './Dialog';
import { useFeatureTheme } from './FeatureTheme';
import styles from './large-editor.module.css';
import { useFocusTrap } from './use-focus-trap';

export type DraftSaveOutcome = { ok: true; message?: string } | { ok: false; error: string };

export interface EditorDraftRecoveryConfig {
  savedAtLabel: string;
  stale?: boolean;
  staleMessage?: string;
  onResume: () => void;
  onDiscard: () => void;
}

export interface LargeEditorDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  eyebrow?: string;
  formId: string;
  isDirty: boolean;
  isSubmitting?: boolean;
  submitLabel: string;
  submittingLabel?: string;
  cancelLabel?: string;
  draftLabel?: string;
  closeAriaLabel?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
  errorMessage?: string | null;
  draftRecovery?: EditorDraftRecoveryConfig | null;
  onSaveDraft?: () => DraftSaveOutcome | boolean | void | Promise<DraftSaveOutcome | boolean | void>;
  onDiscardChanges?: () => void;
  footerActions?: ReactNode;
  portal?: boolean;
  className?: string;
  children: ReactNode;
}

function isPromiseLike<T>(value: T | PromiseLike<T>): value is PromiseLike<T> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'then' in value &&
    typeof (value as { then?: unknown }).then === 'function'
  );
}

function normalizeDraftOutcome(result: DraftSaveOutcome | boolean | void): DraftSaveOutcome {
  if (result === false) {
    return { ok: false, error: 'Could not save your local draft right now.' };
  }
  if (result === true || result === undefined) {
    return { ok: true };
  }
  return result;
}

export function LargeEditorTwoColumn({
  primary,
  metadata,
  className,
}: {
  primary: ReactNode;
  metadata: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(styles.twoColumn, className)}>
      <div className={styles.primaryColumn}>{primary}</div>
      <div className={styles.metaColumn}>{metadata}</div>
    </div>
  );
}

export function LargeEditorDialog({
  open,
  onClose,
  title,
  description,
  eyebrow,
  formId,
  isDirty,
  isSubmitting = false,
  submitLabel,
  submittingLabel,
  cancelLabel = 'Cancel',
  draftLabel = 'Save draft',
  closeAriaLabel = 'Close editor',
  initialFocusRef,
  errorMessage,
  draftRecovery,
  onSaveDraft,
  onDiscardChanges,
  footerActions,
  portal = true,
  className,
  children,
}: LargeEditorDialogProps) {
  const featureTheme = useFeatureTheme();
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const reducedMotion = useReducedMotion();

  const [closePromptOpen, setClosePromptOpen] = useState(false);
  const [draftNotice, setDraftNotice] = useState('');
  const [draftError, setDraftError] = useState('');
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  useEffect(() => {
    if (open) {
      setClosePromptOpen(false);
      setDraftNotice('');
      setDraftError('');
      setIsSavingDraft(false);
      pendingNavigationRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (!open || !isDirty || typeof window === 'undefined') {
      return undefined;
    }
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty, open]);

  const requestClose = useCallback(() => {
    if (closePromptOpen) {
      pendingNavigationRef.current = null;
      setClosePromptOpen(false);
      return;
    }
    if (isDirty) {
      pendingNavigationRef.current = null;
      setClosePromptOpen(true);
      return;
    }
    onClose();
  }, [closePromptOpen, isDirty, onClose]);

  const handleNavigationAttempt = useCallback((proceed: () => void) => {
    pendingNavigationRef.current = proceed;
    setClosePromptOpen(true);
  }, []);

  useNavigationGuard(open && isDirty, handleNavigationAttempt);

  useFocusTrap({
    open,
    containerRef: panelRef,
    initialFocusRef,
    onClose: requestClose,
  });

  const applyExplicitDraftOutcome = (outcome: DraftSaveOutcome) => {
    if (!outcome.ok) {
      setDraftNotice('');
      setDraftError(outcome.error);
      return;
    }
    setDraftError('');
    setDraftNotice(outcome.message ?? 'Draft saved.');
  };

  const handleExplicitSaveDraft = () => {
    if (!onSaveDraft || isSavingDraft) {
      return;
    }
    setDraftError('');
    try {
      const raw = onSaveDraft();
      if (isPromiseLike(raw)) {
        setIsSavingDraft(true);
        void Promise.resolve(raw)
          .then((resolved) => {
            applyExplicitDraftOutcome(normalizeDraftOutcome(resolved));
          })
          .catch((error: unknown) => {
            setDraftNotice('');
            setDraftError(
              error instanceof Error && error.message
                ? error.message
                : 'Could not save your draft right now.',
            );
          })
          .finally(() => {
            setIsSavingDraft(false);
          });
        return;
      }
      applyExplicitDraftOutcome(normalizeDraftOutcome(raw));
    } catch (error) {
      setDraftNotice('');
      setDraftError(
        error instanceof Error && error.message
          ? error.message
          : 'Could not save your draft right now.',
      );
    }
  };

  const completeConfirmSaveDraftClose = () => {
    const proceed = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setClosePromptOpen(false);
    setDraftError('');
    onClose();
    proceed?.();
  };

  const handleConfirmSaveDraftError = (message: string) => {
    pendingNavigationRef.current = null;
    setClosePromptOpen(false);
    setDraftNotice('');
    setDraftError(message);
  };

  const handleConfirmSaveDraftAndClose = () => {
    if (isSavingDraft) {
      return;
    }
    if (!onSaveDraft) {
      completeConfirmSaveDraftClose();
      return;
    }
    setDraftError('');
    try {
      const raw = onSaveDraft();
      if (isPromiseLike(raw)) {
        setIsSavingDraft(true);
        void Promise.resolve(raw)
          .then((resolved) => {
            const outcome = normalizeDraftOutcome(resolved);
            if (!outcome.ok) {
              handleConfirmSaveDraftError(outcome.error);
              return;
            }
            completeConfirmSaveDraftClose();
          })
          .catch((error: unknown) => {
            handleConfirmSaveDraftError(
              error instanceof Error && error.message
                ? error.message
                : 'Could not save your draft right now.',
            );
          })
          .finally(() => {
            setIsSavingDraft(false);
          });
        return;
      }
      const outcome = normalizeDraftOutcome(raw);
      if (!outcome.ok) {
        handleConfirmSaveDraftError(outcome.error);
        return;
      }
      completeConfirmSaveDraftClose();
    } catch (error) {
      handleConfirmSaveDraftError(
        error instanceof Error && error.message
          ? error.message
          : 'Could not save your draft right now.',
      );
    }
  };

  const handleDiscardAndClose = () => {
    const proceed = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setClosePromptOpen(false);
    setDraftError('');
    setDraftNotice('');
    onDiscardChanges?.();
    onClose();
    proceed?.();
  };

  const handleContinueEditing = () => {
    pendingNavigationRef.current = null;
    setClosePromptOpen(false);
  };

  const handleBodyFocusCapture = (event: FocusEvent<HTMLDivElement>) => {
    const target = event.target;
    if (target instanceof HTMLElement && typeof target.scrollIntoView === 'function') {
      target.scrollIntoView({ block: 'nearest' });
    }
  };

  const content = (
    <>
      <AnimatePresence>
        {open ? (
          <div style={{ zIndex: 'var(--z-drawer)' }} className={styles.viewport}>
            <motion.div
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: reducedMotion ? 0 : MOTION_DURATION.drawerClose,
                ease: MOTION_EASE,
              }}
              onClick={requestClose}
              className={styles.backdrop}
            />
            <motion.div
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              aria-describedby={description ? descId : undefined}
              tabIndex={-1}
              initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.99 }}
              transition={{
                duration: reducedMotion ? 0 : MOTION_DURATION.base,
                ease: MOTION_EASE,
              }}
              data-theme="workspace"
              data-feature-theme={featureTheme}
              className={cn(styles.panel, featureTheme && '[overflow-wrap:anywhere]', className)}
            >
              <div className={styles.header}>
                <div className="min-w-0">
                  {eyebrow ? (
                    <span className="text-[length:var(--fs-micro)] font-medium text-ws-text-muted block">
                      {eyebrow}
                    </span>
                  ) : null}
                  <h2
                    id={titleId}
                    className="font-display text-[1.5rem] leading-[var(--lh-heading)] font-semibold text-ws-text"
                  >
                    {title}
                  </h2>
                  {description ? (
                    <p
                      id={descId}
                      className="mt-1 text-[length:var(--fs-small)] text-ws-text-muted"
                    >
                      {description}
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  aria-label={closeAriaLabel}
                  onClick={requestClose}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-pill text-ws-text hover:bg-ws-accent-soft cursor-pointer transition-colors duration-[var(--dur-fast)] shrink-0"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>

              <div className={cn(styles.body, 'space-y-4')} onFocusCapture={handleBodyFocusCapture}>
                {draftRecovery ? (
                  <div
                    role="status"
                    className="flex flex-wrap items-center justify-between gap-2 rounded-item border border-ws-border bg-ws-accent-soft px-4 py-2.5 text-[length:var(--fs-small)]"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <p className="text-ws-text font-medium">
                        Local draft saved {draftRecovery.savedAtLabel}.
                      </p>
                      {draftRecovery.stale ? (
                        <p className="text-text-overdue text-[length:var(--fs-micro)]">
                          {draftRecovery.staleMessage ??
                            'This item was updated after your local draft was saved. Review changes before saving.'}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setDraftError('');
                          draftRecovery.onResume();
                          setDraftNotice('Local draft restored into the editor.');
                        }}
                      >
                        Resume draft
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          draftRecovery.onDiscard();
                          setDraftNotice('Saved local draft discarded.');
                        }}
                      >
                        Discard
                      </Button>
                    </div>
                  </div>
                ) : null}

                {draftNotice ? (
                  <p role="status" className="text-[length:var(--fs-small)] text-ws-accent">
                    {draftNotice}
                  </p>
                ) : null}

                {draftError ? (
                  <p
                    role="alert"
                    className="rounded-item border border-tint-overdue-border bg-tint-overdue-bg px-3.5 py-2.5 text-[length:var(--fs-small)] text-text-overdue"
                  >
                    {draftError}
                  </p>
                ) : null}

                {errorMessage ? (
                  <p
                    role="alert"
                    className="rounded-item border border-tint-overdue-border bg-tint-overdue-bg px-3.5 py-2.5 text-[length:var(--fs-small)] text-text-overdue"
                  >
                    {errorMessage}
                  </p>
                ) : null}

                {children}
              </div>

              <div className={styles.footer}>
                {onSaveDraft ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void handleExplicitSaveDraft()}
                    disabled={isSubmitting || isSavingDraft}
                  >
                    {isSavingDraft ? 'Saving draft…' : draftLabel}
                  </Button>
                ) : (
                  <span />
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={requestClose}
                    disabled={isSubmitting || isSavingDraft}
                  >
                    {cancelLabel}
                  </Button>
                  {footerActions}
                  <Button
                    type="submit"
                    form={formId}
                    variant="primary"
                    size="sm"
                    disabled={isSubmitting || isSavingDraft}
                  >
                    {isSubmitting ? (submittingLabel ?? submitLabel) : submitLabel}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>

      <Dialog
        open={closePromptOpen}
        onClose={handleContinueEditing}
        title="Save changes before closing?"
        description={
          pendingNavigationRef.current
            ? 'You have unsaved edits. Save a draft, discard your changes, or keep editing before leaving this page.'
            : 'Your edits have not been applied yet.'
        }
        portal={portal}
        className="max-w-[540px]"
        footer={
          <div
            className={cn(
              'w-full grid gap-2.5 items-stretch',
              onSaveDraft ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2',
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              disabled={isSavingDraft}
              onClick={handleDiscardAndClose}
              className="w-full h-full min-h-[2.75rem] whitespace-normal leading-snug py-2 text-center"
            >
              Discard changes
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={isSavingDraft}
              onClick={handleContinueEditing}
              className="w-full h-full min-h-[2.75rem] whitespace-normal leading-snug py-2 text-center"
            >
              Continue editing
            </Button>
            {onSaveDraft ? (
              <Button
                variant="primary"
                size="sm"
                disabled={isSavingDraft}
                onClick={() => void handleConfirmSaveDraftAndClose()}
                className="w-full h-full min-h-[2.75rem] whitespace-normal leading-snug py-2 text-center"
              >
                {isSavingDraft ? 'Saving draft…' : 'Save draft and close'}
              </Button>
            ) : null}
          </div>
        }
      />
    </>
  );

  if (portal && typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }
  return content;
}
