'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useClearLearningRoom } from '@/client/queries/learning-room';
import { Button } from '@/ui/Button';
import { ConfirmDialog } from '@/ui/Dialog';
import { useToast } from '@/ui/Toast';
import styles from './focus-room.module.css';

/** Deletes the whole logbook, so every statistic starts again from zero. */
export function ClearMemory() {
  const [open, setOpen] = useState(false);
  const clear = useClearLearningRoom();
  const { pushToast } = useToast();

  const confirm = async () => {
    try {
      await clear.mutateAsync();
      setOpen(false);
      pushToast('Memory cleared. Your logbook and statistics are empty.', 'success');
    } catch {
      setOpen(false);
      pushToast('Could not clear memory. Nothing was deleted. Try again.', 'error');
    }
  };

  return (
    <div className={styles.clearRow}>
      <Button
        variant="ghost"
        size="sm"
        pill
        leftIcon={<Trash2 size={14} strokeWidth={1.6} aria-hidden="true" />}
        onClick={() => setOpen(true)}
      >
        Clear memory
      </Button>
      <ConfirmDialog
        portal
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => void confirm()}
        title="Clear memory?"
        description="This permanently deletes every saved focus session and resets all statistics. It cannot be undone."
        confirmLabel="Clear memory"
        isSubmitting={clear.isPending}
      />
    </div>
  );
}
