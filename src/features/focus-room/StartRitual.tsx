'use client';

import { useEffect, useRef, useState, type ReactElement } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/ui/Button';
import { cn } from '@/ui/cn';
import { Dialog } from '@/ui/Dialog';
import styles from './focus-room.module.css';

/** Seven seconds: breathe in, breathe out. */
export const BREATH_MS = 7000;
const EXHALE_AT_MS = BREATH_MS / 2;

const ICON_PROPS = {
  width: 56,
  height: 56,
  viewBox: '0 0 64 64',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

const PhoneIcon = () => (
  <svg {...ICON_PROPS}>
    <rect x="20" y="8" width="24" height="44" rx="5" className={styles.iconFill} />
    <path d="M29 46h6" />
    <path d="M10 56L54 6" className={styles.iconAccent} />
  </svg>
);

const BellIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M18 42V30a14 14 0 0 1 28 0v12l4 5H14z" className={styles.iconFill} />
    <path d="M27 52a5 5 0 0 0 10 0" />
    <path d="M44 10h8l-8 8h8" className={styles.iconAccent} />
  </svg>
);

const TabsIcon = () => (
  <svg {...ICON_PROPS}>
    <rect x="8" y="16" width="48" height="36" rx="5" className={styles.iconFill} />
    <path d="M8 26h48" />
    <rect x="12" y="10" width="14" height="8" rx="2" fill="currentColor" />
    <rect x="28" y="10" width="12" height="8" rx="2" opacity="0.35" />
    <rect x="42" y="10" width="10" height="8" rx="2" opacity="0.35" />
  </svg>
);

const HourglassIcon = () => (
  <svg {...ICON_PROPS}>
    <path d="M18 8h28M18 56h28" />
    <path
      d="M22 8c0 14 20 14 20 24S22 42 22 56M42 8c0 14-20 14-20 24s20 10 20 24"
      className={styles.iconFill}
    />
    <path d="M26 52h12" strokeWidth={3} className={styles.iconAccent} />
  </svg>
);

interface Commitment {
  id: string;
  title: string;
  line: string;
  Icon: () => ReactElement;
}

const COMMITMENTS: Commitment[] = [
  {
    id: 'phone',
    title: 'No phone allowed',
    line: 'Put it in another room, or face down and out of reach.',
    Icon: PhoneIcon,
  },
  {
    id: 'notifications',
    title: 'Silence notifications',
    line: 'Turn on Do Not Disturb on this computer and your phone.',
    Icon: BellIcon,
  },
  {
    id: 'tabs',
    title: 'No unnecessary tabs',
    line: 'Close everything this session does not need.',
    Icon: TabsIcon,
  },
  {
    id: 'time',
    title: 'Respect your time',
    line: 'This block is booked. Stay with it until the bell.',
    Icon: HourglassIcon,
  },
];

interface StartRitualProps {
  /** The commitments were already confirmed today, so only the breath is shown. */
  commitmentsDone: boolean;
  onCancel: () => void;
  onStart: () => void;
}

/**
 * A seven second breath before every session, then four commitments that must all be confirmed.
 * Once confirmed, the commitments are skipped for the rest of the day.
 */
export function StartRitual({ commitmentsDone, onCancel, onStart }: StartRitualProps) {
  const [step, setStep] = useState<'breath' | 'ritual'>('breath');
  const [exhale, setExhale] = useState(false);
  const [confirmed, setConfirmed] = useState<ReadonlySet<string>>(new Set());
  const onStartRef = useRef(onStart);

  useEffect(() => {
    onStartRef.current = onStart;
  }, [onStart]);

  useEffect(() => {
    const exhaleTimer = window.setTimeout(() => setExhale(true), EXHALE_AT_MS);
    const ritualTimer = window.setTimeout(() => {
      if (commitmentsDone) onStartRef.current();
      else setStep('ritual');
    }, BREATH_MS);
    return () => {
      window.clearTimeout(exhaleTimer);
      window.clearTimeout(ritualTimer);
    };
  }, [commitmentsDone]);

  const toggle = (id: string) =>
    setConfirmed((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const ready = confirmed.size === COMMITMENTS.length;

  return (
    <Dialog
      open
      portal
      onClose={onCancel}
      title={step === 'breath' ? 'Take a deep breath' : 'Focus ritual'}
      className="w-[75vw] max-w-none h-[min(75vh,38rem)] min-w-[min(92vw,20rem)] flex flex-col [&>div.mt-4]:flex-1 [&>div.mt-4]:min-h-0"
      footer={
        step === 'ritual' ? (
          <>
            <Button variant="ghost" pill onClick={onCancel}>
              Not yet
            </Button>
            <Button variant="primary" pill disabled={!ready} onClick={onStart}>
              Start session
            </Button>
          </>
        ) : (
          <Button variant="ghost" pill onClick={onCancel}>
            Cancel
          </Button>
        )
      }
    >
      {step === 'breath' ? (
        <div className={styles.breath}>
          <div className={styles.breathStage} aria-hidden="true">
            <span className={styles.breathHalo} />
            <span className={styles.breathOrb} />
          </div>
          <p className={styles.breathWord} role="status">
            {exhale ? 'Breathe out' : 'Breathe in'}
          </p>
          <span className={styles.breathTrack} aria-hidden="true">
            <span className={styles.breathFill} />
          </span>
        </div>
      ) : (
        <div className={styles.ritual}>
          <p className={styles.ritualCount} aria-live="polite">
            {confirmed.size} of {COMMITMENTS.length} confirmed
          </p>
          <div className={styles.ritualGrid}>
            {COMMITMENTS.map(({ id, title, line, Icon }) => {
              const on = confirmed.has(id);
              return (
                <button
                  key={id}
                  type="button"
                  aria-pressed={on}
                  className={cn(styles.vow, on && styles.vowOn)}
                  onClick={() => toggle(id)}
                >
                  <span className={styles.vowArt}>
                    <Icon />
                  </span>
                  <span className={styles.vowText}>
                    <span className={styles.vowTitle}>{title}</span>
                    <span className={styles.vowLine}>{line}</span>
                    <span className={styles.vowChip}>
                      {on ? <Check size={12} strokeWidth={2.4} aria-hidden="true" /> : null}
                      {on ? 'I commit' : 'Tap to commit'}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </Dialog>
  );
}
