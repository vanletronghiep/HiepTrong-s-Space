'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import type { FeatureCollectionLayout } from '@/client/preferences';
import type { ZodiacThumbnailControl } from '@/features/home/feature-collection/FeatureThumbnail';
import { HorizontalGallery } from '@/features/home/feature-collection/HorizontalGallery';
import { VerticalGrid } from '@/features/home/feature-collection/VerticalGrid';
import type { FeatureEntry } from '@/features/registry';
import { preloadZodiacEnhancement } from '@/features/zodiac/loader';
import type { ZodiacControllerSnapshot, ZodiacSign } from '@/features/zodiac/types';
import { ZODIAC_PREVIEW_FEATURES } from './preview-dataset';
import styles from './zodiac-preview.module.css';

type PreviewControlMode = 'interactive' | 'playing-inward' | 'playing-outward' | 'frozen';

const SIGN_OPTIONS: ReadonlyArray<{ sign: ZodiacSign; label: string; featureTitle: string }> =
  ZODIAC_PREVIEW_FEATURES.flatMap((feature) =>
    feature.thumbnail.zodiacSign
      ? [{ sign: feature.thumbnail.zodiacSign, label: feature.thumbnail.zodiacSign.toUpperCase(), featureTitle: feature.title }]
      : [],
  );

const OUTLINE_PHASE_END = 8 / 13;

const MILESTONES: ReadonlyArray<{ id: string; label: string; value: number }> = [
  { id: 'idle', label: 'Idle (0)', value: 0 },
  { id: 'q1', label: '25%', value: 0.25 },
  { id: 'q2', label: '50%', value: 0.5 },
  { id: 'outline-end', label: 'Outline (8/13)', value: OUTLINE_PHASE_END },
  { id: 'mid-fill', label: 'Mid-fill (80%)', value: 0.8 },
  { id: 'fade-gate', label: '98.5%', value: 0.985 },
];

export function ZodiacIlluminationPreview() {
  // Local-only preview layout state; never reads or writes production layout preferences.
  const [selectedSign, setSelectedSign] = useState<ZodiacSign>('aquarius');
  const [layout, setLayout] = useState<FeatureCollectionLayout>('horizontal');
  const [mode, setMode] = useState<PreviewControlMode>('interactive');
  const [frozenProgress, setFrozenProgress] = useState(0);
  const [disableGlow, setDisableGlow] = useState(false);
  const [showGuides, setShowGuides] = useState(false);

  const scrubberRef = useRef<HTMLInputElement>(null);
  const progressOutputRef = useRef<HTMLOutputElement>(null);
  const phaseOutputRef = useRef<HTMLOutputElement>(null);
  const glowOutputRef = useRef<HTMLOutputElement>(null);
  const pendingGlowJumpRef = useRef(0);
  const lastSnapshotRef = useRef<ZodiacControllerSnapshot>({
    p: 0,
    v: 0,
    target: 0,
    phase: 'idle',
    glowPhase: 0,
    glowOpacity: 0,
    settled: true,
  });

  useEffect(() => {
    void preloadZodiacEnhancement(selectedSign);
  }, [selectedSign]);

  useEffect(() => {
    return () => {
      if (pendingGlowJumpRef.current && typeof cancelAnimationFrame === 'function') {
        cancelAnimationFrame(pendingGlowJumpRef.current);
        pendingGlowJumpRef.current = 0;
      }
    };
  }, []);

  const cancelPendingGlowJump = useCallback(() => {
    if (pendingGlowJumpRef.current && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(pendingGlowJumpRef.current);
      pendingGlowJumpRef.current = 0;
    }
  }, []);

  const syncReadouts = useCallback((snapshot: ZodiacControllerSnapshot, syncScrubber: boolean) => {
    if (progressOutputRef.current) {
      progressOutputRef.current.textContent = snapshot.p.toFixed(4);
    }
    if (phaseOutputRef.current) {
      phaseOutputRef.current.textContent = snapshot.phase;
    }
    if (glowOutputRef.current) {
      glowOutputRef.current.textContent = snapshot.glowOpacity.toFixed(2);
    }
    if (syncScrubber && scrubberRef.current) {
      scrubberRef.current.value = snapshot.p.toFixed(4);
    }
  }, []);

  const handleFrame = useCallback(
    (snapshot: ZodiacControllerSnapshot) => {
      lastSnapshotRef.current = snapshot;
      syncReadouts(snapshot, mode !== 'frozen');
    },
    [mode, syncReadouts],
  );

  const freezeAt = useCallback(
    (value: number) => {
      cancelPendingGlowJump();
      const clamped = Math.max(0, Math.min(1, value));
      setMode('frozen');
      setFrozenProgress(clamped);
      if (scrubberRef.current) {
        scrubberRef.current.value = clamped.toFixed(4);
      }
    },
    [cancelPendingGlowJump],
  );

  const handlePlayInward = () => {
    cancelPendingGlowJump();
    setMode('playing-inward');
  };

  const handlePlayOutward = () => {
    cancelPendingGlowJump();
    setMode('playing-outward');
  };

  const handlePause = () => {
    freezeAt(lastSnapshotRef.current.p);
  };

  const handleReset = () => {
    freezeAt(0);
  };

  const handleInteractive = () => {
    cancelPendingGlowJump();
    setMode('interactive');
  };

  const handleCompleteWithGlow = () => {
    cancelPendingGlowJump();
    setDisableGlow(false);
    setMode('frozen');
    setFrozenProgress(1);
    if (scrubberRef.current) {
      scrubberRef.current.value = '1.0000';
    }
    if (typeof requestAnimationFrame === 'function') {
      pendingGlowJumpRef.current = requestAnimationFrame(() => {
        pendingGlowJumpRef.current = 0;
        setMode('playing-inward');
      });
    } else {
      setMode('playing-inward');
    }
  };

  const handleScrubberChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = Number.parseFloat(event.currentTarget.value);
    if (Number.isFinite(next)) {
      freezeAt(next);
    }
  };

  const handleJumpToSelectedCard = () => {
    const targetFeature =
      ZODIAC_PREVIEW_FEATURES.find((feature) => feature.thumbnail.zodiacSign === selectedSign) ??
      ZODIAC_PREVIEW_FEATURES.find((feature) => feature.id === 'learning-room');
    if (!targetFeature) return;

    const card = document.querySelector<HTMLElement>(`[data-feature-id="${targetFeature.id}"]`);
    if (!card) return;

    const pinnedOuter = document.querySelector<HTMLElement>(
      '[data-testid="horizontal-pinned-outer"]',
    );
    if (layout === 'horizontal' && pinnedOuter) {
      const outerTop = pinnedOuter.getBoundingClientRect().top + window.scrollY;
      const travel = Math.max(0, pinnedOuter.offsetHeight - window.innerHeight);
      const featureIndex = ZODIAC_PREVIEW_FEATURES.findIndex((f) => f.id === targetFeature.id);
      const ratio =
        featureIndex >= 0 && ZODIAC_PREVIEW_FEATURES.length > 1
          ? featureIndex / (ZODIAC_PREVIEW_FEATURES.length - 1)
          : 1;
      window.scrollTo({ top: outerTop + travel * ratio, behavior: 'instant' });
      return;
    }

    card.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
  };

  const getZodiacControl = useCallback(
    (feature: FeatureEntry): ZodiacThumbnailControl | undefined => {
      if (feature.thumbnail.zodiacSign !== selectedSign) {
        return undefined;
      }
      return {
        manualProgress: mode === 'frozen' ? frozenProgress : undefined,
        activeOverride:
          mode === 'playing-inward' ? true : mode === 'playing-outward' ? false : undefined,
        disableGlow,
        showGuides,
        onFrame: handleFrame,
      };
    },
    [disableGlow, frozenProgress, handleFrame, mode, selectedSign, showGuides],
  );

  const activeSignMeta = SIGN_OPTIONS.find((option) => option.sign === selectedSign);

  return (
    <main data-theme="cosmos" className={styles.page}>
      <section aria-label="Zodiac illumination preview controls" className={styles.controlDock}>
        <div className={styles.controlInner}>
          <div className={styles.topRow}>
            <div className={styles.titleGroup}>
              <span className={styles.previewBadge}>Isolated preview</span>
              <h1 className={styles.previewTitle}>
                {activeSignMeta
                  ? `${activeSignMeta.sign.charAt(0).toUpperCase()}${activeSignMeta.sign.slice(1)} zodiac illumination — ${activeSignMeta.featureTitle}`
                  : 'Zodiac illumination preview'}
              </h1>
            </div>

            <div className={styles.telemetry}>
              <span>
                Mode:{' '}
                <strong className={styles.telemetryValue} data-testid="zodiac-mode-label">
                  {mode}
                </strong>
              </span>
              <span>
                p:{' '}
                <output
                  ref={progressOutputRef}
                  data-testid="zodiac-progress-readout"
                  className={styles.telemetryValue}
                >
                  0.0000
                </output>
              </span>
              <span>
                Phase:{' '}
                <output
                  ref={phaseOutputRef}
                  data-testid="zodiac-phase-readout"
                  className={styles.telemetryValue}
                >
                  idle
                </output>
              </span>
              <span>
                Glow:{' '}
                <output
                  ref={glowOutputRef}
                  data-testid="zodiac-glow-readout"
                  className={styles.telemetryValue}
                >
                  0.00
                </output>
              </span>
            </div>
          </div>

          <div className={styles.controlsRow}>
            <div className={styles.buttonGroup} role="group" aria-label="Playback controls">
              <button
                type="button"
                data-testid="zodiac-interactive"
                aria-pressed={mode === 'interactive'}
                onClick={handleInteractive}
                className={styles.controlBtn}
              >
                Hover / Focus
              </button>
              <button
                type="button"
                data-testid="zodiac-play-inward"
                aria-pressed={mode === 'playing-inward'}
                onClick={handlePlayInward}
                className={styles.controlBtn}
              >
                Play Inward
              </button>
              <button
                type="button"
                data-testid="zodiac-play-outward"
                aria-pressed={mode === 'playing-outward'}
                onClick={handlePlayOutward}
                className={styles.controlBtn}
              >
                Play Outward
              </button>
              <button
                type="button"
                data-testid="zodiac-pause"
                onClick={handlePause}
                className={styles.controlBtn}
              >
                Pause
              </button>
              <button
                type="button"
                data-testid="zodiac-reset"
                onClick={handleReset}
                className={styles.controlBtn}
              >
                Reset
              </button>
            </div>

            <div className={styles.scrubberGroup}>
              <label htmlFor="zodiac-scrubber" className={styles.scrubberLabel}>
                Scrubber p
              </label>
              <input
                ref={scrubberRef}
                id="zodiac-scrubber"
                data-testid="zodiac-scrubber"
                type="range"
                min={0}
                max={1}
                step={0.001}
                defaultValue={0}
                onChange={handleScrubberChange}
                className={styles.scrubberInput}
              />
            </div>

            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                data-testid="zodiac-disable-glow"
                checked={disableGlow}
                onChange={(event) => setDisableGlow(event.currentTarget.checked)}
                className={styles.toggleInput}
              />
              <span>Disable glow</span>
            </label>

            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                data-testid="zodiac-show-guides"
                checked={showGuides}
                onChange={(event) => setShowGuides(event.currentTarget.checked)}
                className={styles.toggleInput}
              />
              <span>Show guides</span>
            </label>
          </div>

          <div className={styles.controlsRow}>
            <div className={styles.buttonGroup} role="group" aria-label="Quick-jump milestones">
              {MILESTONES.map((milestone) => (
                <button
                  key={milestone.id}
                  type="button"
                  data-testid={`zodiac-milestone-${milestone.id}`}
                  data-active={
                    mode === 'frozen' && Math.abs(frozenProgress - milestone.value) < 0.001
                      ? 'true'
                      : 'false'
                  }
                  onClick={() => freezeAt(milestone.value)}
                  className={styles.controlBtn}
                >
                  {milestone.label}
                </button>
              ))}
              <button
                type="button"
                data-testid="zodiac-milestone-complete-glow"
                onClick={handleCompleteWithGlow}
                className={styles.controlBtn}
              >
                100% + Glow
              </button>
            </div>

            <div className={styles.buttonGroup} role="group" aria-label="Preview layout switcher">
              <select
                aria-label="Active zodiac sign"
                data-testid="zodiac-sign-select"
                value={selectedSign}
                onChange={(event) => {
                  const nextSign = event.currentTarget.value as ZodiacSign;
                  setSelectedSign(nextSign);
                }}
                className={styles.controlBtn}
              >
                {SIGN_OPTIONS.map((option) => (
                  <option key={option.sign} value={option.sign}>
                    {option.label} — {option.featureTitle}
                  </option>
                ))}
              </select>
              <button
                type="button"
                data-testid="zodiac-layout-horizontal"
                aria-pressed={layout === 'horizontal'}
                onClick={() => setLayout('horizontal')}
                className={styles.controlBtn}
              >
                Preview: Horizontal
              </button>
              <button
                type="button"
                data-testid="zodiac-layout-vertical"
                aria-pressed={layout === 'vertical'}
                onClick={() => setLayout('vertical')}
                className={styles.controlBtn}
              >
                Preview: Vertical
              </button>
              <button
                type="button"
                data-testid="zodiac-jump-learning-room"
                onClick={handleJumpToSelectedCard}
                className={styles.controlBtn}
              >
                Scroll to Active Card
              </button>
            </div>
          </div>
        </div>
      </section>

      <section aria-label="Feature collection preview" className={styles.galleryHost}>
        {layout === 'horizontal' ? (
          <HorizontalGallery
            features={ZODIAC_PREVIEW_FEATURES}
            layout={layout}
            onLayoutChange={setLayout}
            revealComplete
            getZodiacControl={getZodiacControl}
          />
        ) : (
          <VerticalGrid
            features={ZODIAC_PREVIEW_FEATURES}
            layout={layout}
            onLayoutChange={setLayout}
            revealComplete
            getZodiacControl={getZodiacControl}
          />
        )}
      </section>
    </main>
  );
}
