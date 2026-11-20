'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useCreateWritingPage } from '@/client/queries/writing';
import { plainTextToDoc } from '@/domain/writing';
import { Button } from '@/ui/Button';
import { Dialog } from '@/ui/Dialog';
import { FeatureThemeProvider } from '@/ui/FeatureTheme';
import { useToast } from '@/ui/Toast';
import styles from './writing.module.css';

const TITLE_MAX = 60;

/** First line of the note, trimmed, as a page title. */
export function quickNoteTitle(text: string): string {
  const first = text.trim().split('\n')[0]?.trim() ?? '';
  return first.length > TITLE_MAX ? `${first.slice(0, TITLE_MAX - 1).trimEnd()}…` : first;
}

function isTyping(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null;
  return Boolean(
    element &&
    (element.tagName === 'INPUT' ||
      element.tagName === 'TEXTAREA' ||
      element.tagName === 'SELECT' ||
      element.isContentEditable),
  );
}

function QuickNoteDialog({ onClose }: { onClose: () => void }) {
  const create = useCreateWritingPage();
  const { pushToast } = useToast();
  const fieldId = useId();
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const save = async () => {
    const body = text.trim();
    if (!body) return;
    setError('');
    try {
      await create.mutateAsync({
        room: 'drafts',
        title: quickNoteTitle(body),
        content: JSON.stringify(plainTextToDoc(body)),
        ripeness: 'seed',
      });
      onClose();
      pushToast('Saved to Draft Room', 'success');
    } catch {
      setError('Could not save the note. Your text is still here.');
    }
  };

  return (
    <FeatureThemeProvider name="blogs-hub">
      <Dialog
        portal
        open
        onClose={onClose}
        title="Quick note"
        description="It lands in Draft Room as a seed."
        initialFocusRef={textRef}
        footer={
          <div className={styles.quickActions}>
            <span className={styles.quickHint}>Ctrl + Enter to save</span>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void save()}
              disabled={create.isPending || !text.trim()}
            >
              {create.isPending ? 'Saving…' : 'Save note'}
            </Button>
          </div>
        }
      >
        <label htmlFor={fieldId} className="sr-only">
          Note
        </label>
        <textarea
          id={fieldId}
          ref={textRef}
          className={styles.quickTextarea}
          value={text}
          placeholder="What is on your mind?"
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
              event.preventDefault();
              void save();
            }
          }}
        />
        {error ? (
          <p role="alert" className={styles.formError}>
            {error}
          </p>
        ) : null}
      </Dialog>
    </FeatureThemeProvider>
  );
}

/**
 * Drops a thought into Draft Room from any page. Alt + N opens the card.
 * (Ctrl + Shift + N is reserved by the browser for a private window.)
 * The card, and the data hooks it needs, only mount once it is opened.
 */
export function QuickNote() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const alt = event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
      if (alt && event.key.toLowerCase() === 'n' && !isTyping(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return open ? <QuickNoteDialog onClose={() => setOpen(false)} /> : null;
}
