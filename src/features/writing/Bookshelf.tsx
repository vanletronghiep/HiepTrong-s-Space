'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useTransitionRouter } from '@/features/transitions/TransitionProvider';
import { cn } from '@/ui/cn';
import styles from './bookshelf.module.css';

export type BookRoom = 'drafts' | 'perspective' | 'private';

export interface BookshelfProps {
  /** One short line under each book. Never contains private titles or counts. */
  tags: Record<BookRoom, string>;
  /** The lantern glows on days something was written. */
  lit: boolean;
  summary: string;
}

const OPEN_MS = 1000;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function Bookshelf({ tags, lit, summary }: BookshelfProps) {
  const router = useTransitionRouter();
  const [openRoom, setOpenRoom] = useState<BookRoom | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const open = (room: BookRoom) => {
    if (openRoom) return;
    setOpenRoom(room);
    // Let the cover swing open, then go in. Reduced motion skips the wait.
    timer.current = setTimeout(
      () => router.push(`/writing/${room}`),
      prefersReducedMotion() ? 0 : OPEN_MS,
    );
  };

  const bookProps = (room: BookRoom, label: string) => ({
    type: 'button' as const,
    'aria-label': `${label}. ${tags[room]}. Open book`,
    'aria-busy': openRoom === room,
    onClick: () => open(room),
  });

  return (
    <section className={styles.study} aria-labelledby="writing-shelf-title">
      <div className={styles.studyTop}>
        <div>
          <h2 id="writing-shelf-title" className={styles.studyTitle}>
            The shelf
          </h2>
          <p className={styles.studySub}>
            {lit
              ? 'The lantern is lit. You wrote today.'
              : 'The lantern is waiting for the first words.'}
          </p>
        </div>
        <Image
          src="/visuals/blogs-hub/cabin-lantern.svg"
          alt={lit ? 'A lit lantern' : 'An unlit lantern'}
          width={86}
          height={120}
          unoptimized
          className={cn(styles.lantern, lit && styles.lanternLit)}
        />
      </div>

      <div className={styles.row}>
        <button
          {...bookProps('drafts', 'Draft Room')}
          className={cn(styles.book, styles.draft, openRoom === 'drafts' && styles.open)}
        >
          <div className={styles.body}>
            <div className={styles.back} />
            <div className={styles.edge} />
            <div className={styles.inner} aria-hidden="true">
              <span className={styles.innerLabel}>Room 01</span>
              <span className={styles.innerTitle}>Draft Room</span>
              <span>Loose notes and half-thoughts. Nothing here has to be good yet.</span>
              <span className={styles.innerRule} />
              <span className={styles.innerRule} />
              <span className={styles.innerEnter}>Enter room →</span>
            </div>
            <div className={styles.cover}>
              <div className={styles.front}>
                <span className={styles.band} />
                <span className={styles.paperLabel}>
                  <span className={styles.labelTitle}>Draft Room</span>
                  <span className={styles.labelSub}>Loose notes</span>
                </span>
                <span className={styles.tabs} aria-hidden="true">
                  <i style={{ background: 'var(--book-tab-1)' }} />
                  <i style={{ background: 'var(--book-tab-2)' }} />
                  <i style={{ background: 'var(--book-tab-3)' }} />
                </span>
              </div>
              <div className={styles.inside} />
            </div>
          </div>
          <span className={styles.tag}>{tags.drafts}</span>
        </button>

        <button
          {...bookProps('perspective', 'My Perspective')}
          className={cn(styles.book, styles.persp, openRoom === 'perspective' && styles.open)}
        >
          <div className={styles.body}>
            <div className={styles.back} />
            <div className={styles.edge} />
            <div className={styles.inner} aria-hidden="true">
              <span className={styles.innerLabel}>Room 02</span>
              <span className={styles.innerTitle}>My Perspective</span>
              <span>Essays on life&apos;s questions, written slowly and revisited later.</span>
              <span className={styles.innerRule} />
              <span className={styles.innerRule} />
              <span className={styles.innerEnter}>Enter room →</span>
            </div>
            <div className={styles.cover}>
              <div className={styles.front}>
                <span className={styles.foil}>
                  <Image
                    src="/visuals/blogs-hub/falling-maple-pair.svg"
                    alt=""
                    aria-hidden="true"
                    width={80}
                    height={80}
                    unoptimized
                    className={styles.foilArt}
                  />
                  <span className={styles.foilTitle}>My Perspective</span>
                  <span className={styles.foilSub}>Essays</span>
                </span>
              </div>
              <div className={styles.inside} />
            </div>
            <span className={styles.ribbon} aria-hidden="true" />
          </div>
          <span className={styles.tag}>{tags.perspective}</span>
        </button>

        <button
          {...bookProps('private', 'Private Room')}
          className={cn(styles.book, styles.priv, openRoom === 'private' && styles.open)}
        >
          <div className={styles.body}>
            <div className={styles.back} />
            <div className={styles.edge} />
            <div className={styles.inner} aria-hidden="true">
              <span className={styles.innerLabel}>Room 03</span>
              <span className={styles.innerTitle}>Private Room</span>
              <div className={styles.lockbox}>
                <span className={styles.lockDots}>● ● ● ● ○ ○</span>
                <span className={styles.lockLine}>Password</span>
              </div>
              <span className={styles.innerEnter}>Unlock →</span>
            </div>
            <div className={styles.cover}>
              <div className={styles.front}>
                <span className={styles.stitch} />
                <span className={styles.deboss}>
                  <span className={styles.debossTitle}>Private Room</span>
                  <span className={styles.debossSub}>Diary · Reflections</span>
                </span>
                <span className={cn(styles.corner, styles.cornerTop)} />
                <span className={cn(styles.corner, styles.cornerBottom)} />
                <span className={styles.strap}>
                  <span className={styles.clasp} />
                </span>
              </div>
              <div className={styles.inside} />
            </div>
          </div>
          <span className={styles.tag}>{tags.private}</span>
        </button>
      </div>
      <div className={styles.plank} />
      <div className={styles.foot}>
        <span>{summary}</span>
        <span>
          Quick note: <b>Alt + N</b> from anywhere
        </span>
      </div>
    </section>
  );
}
