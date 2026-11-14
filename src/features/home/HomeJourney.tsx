'use client';

import Image from 'next/image';
import { Bell } from 'lucide-react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { BellButton } from '@/features/notifications/BellButton';
import { StarIcon } from '@/ui/StarIcon';
import { FeatureCollection } from './feature-collection/FeatureCollection';
import { HomeFooter } from './HomeFooter';
import {
  clamp,
  computeCollectionRevealState,
  ease,
  EARTH_SPEED,
  formatRevealClipPath,
  getHomeViewportMode,
  getRevealRadius,
  heroEarthPose,
  HOME_INTRO_COPY,
  INITIAL_EARTH_YAW,
  mix,
  REVEAL_SMOOTH_FACTOR,
  stepSmoothProgress,
  supportsCollectionReveal,
  type CollectionRevealState,
} from './home-journey';
import { Starfield } from './starfield/Starfield';
import type { StarfieldEngine } from './starfield/starfield-engine';
import styles from './home-journey.module.css';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function HomeJourney({ preview = false }: { preview?: boolean }) {
  const mainRef = useRef<HTMLElement>(null);
  const intro = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const introCol = useRef<HTMLDivElement>(null);
  const collectionSurface = useRef<HTMLDivElement>(null);
  const collectionRevealSpacer = useRef<HTMLDivElement>(null);
  const stars = useRef<StarfieldEngine | null>(null);

  const [revealEnabled, setRevealEnabled] = useState(true);
  const [revealComplete, setRevealComplete] = useState(false);
  const [scrollStartOffset, setScrollStartOffset] = useState<number | undefined>(undefined);

  const revealEnabledRef = useRef(true);
  const revealStateRef = useRef<CollectionRevealState>('hidden');
  const revealCompleteRef = useRef(false);
  const scrollStartOffsetRef = useRef<number | undefined>(undefined);
  const revealProgressRef = useRef('0.0000');
  const earthLockedRef = useRef(false);
  const starsPausedRef = useRef(false);
  const reducedMotionRef = useRef(false);
  const actionsRef = useRef<{
    jumpToCollection: (focusHeading?: boolean) => void;
    returnHome: () => void;
    schedule: () => void;
  } | null>(null);

  const setStars = useCallback((engine: StarfieldEngine | null) => {
    stars.current = engine;
    if (engine) {
      engine.setPaused(starsPausedRef.current);
      if (!reducedMotionRef.current && starsPausedRef.current) {
        actionsRef.current?.schedule();
      }
    }
  }, []);

  const handleSkipToCollection = useCallback((event: ReactMouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (window.location.hash !== '#features') {
      window.history.replaceState(
        null,
        '',
        `${window.location.pathname}${window.location.search}#features`,
      );
    }
    actionsRef.current?.jumpToCollection(true);
  }, []);

  const handleReturnHome = useCallback(() => {
    actionsRef.current?.returnHome();
  }, []);

  useIsomorphicLayoutEffect(() => {
    const surfaceEl = collectionSurface.current;
    if (!surfaceEl) return;
    if (surfaceEl.dataset.revealState !== revealStateRef.current) {
      surfaceEl.dataset.revealState = revealStateRef.current;
    }
    if (surfaceEl.dataset.revealProgress !== revealProgressRef.current) {
      surfaceEl.dataset.revealProgress = revealProgressRef.current;
    }
  }, [revealEnabled, revealComplete, scrollStartOffset]);

  useIsomorphicLayoutEffect(() => {
    const rawSection = intro.current;
    const rawScene = stage.current;
    const rawSurface = canvas.current;
    const rawHit = target.current;
    if (!rawSection || !rawScene || !rawSurface || !rawHit) return undefined;

    const section: HTMLElement = rawSection;
    const scene: HTMLDivElement = rawScene;
    const surface: HTMLCanvasElement = rawSurface;
    const hit: HTMLDivElement = rawHit;
    const introBlock = introCol.current;

    const motion =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    const abort = new AbortController();
    const options = { signal: abort.signal };

    let renderer: Awaited<ReturnType<typeof import('./earth-scene').createEarthScene>> | undefined;
    let frame = 0;
    let focusFrame = 0;
    let previousSpinTime = 0;
    let previousSmoothTime = 0;
    let previousRevealTime = 0;
    let paintedScroll = Number.NaN;
    let visualProgress = Number.NaN;
    let paintedVisualProgress = Number.NaN;
    let visualRevealProgress = Number.NaN;
    let renderedYaw = Number.NaN;
    let paintedRevealState: CollectionRevealState | '' = '';
    let paintedRevealProgress = '';
    let paintedClipPath: string | null = null;
    let paintedInert: boolean | null = null;
    let paintedStageOffset = Number.NaN;
    let paintedEarthCovered: boolean | null = null;
    let pose = heroEarthPose(1440, 900, 0, 0);
    let yaw = INITIAL_EARTH_YAW;
    let resumeAt = 0;
    let width = 0;
    let height = 0;
    let introTop = 0;
    let introHeight = 0;
    let introTravel = 1;
    let revealStart = 0;
    let revealEnd = 0;
    let enabled = !preview;
    let snapNext = true;
    let revealSnapNext = true;
    let wasEarthActive = false;
    let drag: { id: number; x: number; y: number; yaw: number; active: boolean } | undefined;

    section.dataset.homeHydrated = 'true';
    scene.dataset.homeHydrated = 'true';

    const paintState = (progress: number) => {
      const phone = width < 768;
      const mode = getHomeViewportMode(width, height);
      const compactLandscape = mode === 'landscape-compact';

      const p1 = clamp(progress / 0.44);
      const p2 = clamp((progress - 0.44) / 0.34);

      pose = heroEarthPose(width, height, progress, introHeight);

      const logo = ease(p1);
      const openingWidth = Math.min(width * (phone ? 0.88 : 0.78), height * 1.0605, 1120);
      const tuckedLogoWidth = compactLandscape ? 112 : phone ? 132 : 200;
      const logoWidth = mix(openingWidth, tuckedLogoWidth, logo);
      const logoX = mix((width - openingWidth) / 2, phone ? 16 : 24, logo);
      const logoY = mix(
        height * (phone ? 0.18 : 0.16),
        compactLandscape ? 10 : phone ? 14 : 16,
        logo,
      );

      const earthScale = pose.fullDiameter > 0 ? pose.diameter / pose.fullDiameter : 1;
      const earthTx = pose.centerX - pose.diameter / 2;
      const earthTy = pose.centerY - pose.diameter / 2;

      const posterDiameter = pose.diameter * 1.036;
      const posterScale = posterDiameter / 1000;
      const posterTx = pose.centerX - posterDiameter / 2;
      const posterTy = pose.centerY - posterDiameter / 2;

      const flareScale = phone || compactLandscape ? 0.6 : 1;
      const flareHalf = (300 * flareScale) / 2;
      const flareTx = width / 2 - flareHalf;
      const flareTy = pose.centerY - pose.diameter / 2 - flareHalf;

      const fadeIn = motion?.matches ? (p2 >= 0.15 ? 1 : 0) : ease((p2 - 0.8) / 0.2);
      const introOpacity = fadeIn;
      const introShiftY = motion?.matches ? 0 : (1 - fadeIn) * 12;

      scene.style.setProperty('--earth-tx', `${earthTx}px`);
      scene.style.setProperty('--earth-ty', `${earthTy}px`);
      scene.style.setProperty('--earth-scale', String(earthScale));
      scene.style.setProperty('--poster-tx', `${posterTx}px`);
      scene.style.setProperty('--poster-ty', `${posterTy}px`);
      scene.style.setProperty('--poster-scale', String(posterScale));
      scene.style.setProperty('--flare-tx', `${flareTx}px`);
      scene.style.setProperty('--flare-ty', `${flareTy}px`);
      scene.style.setProperty('--flare-scale', String(flareScale));
      scene.style.setProperty('--flare-opacity', String(1 - ease(p1 / 0.8)));

      section.style.setProperty('--logo-x', `${logoX}px`);
      section.style.setProperty('--logo-y', `${logoY}px`);
      section.style.setProperty('--logo-scale', String(logoWidth / 1200));
      section.style.setProperty('--nav-scrim', String(ease((progress - 0.72) / 0.28)));

      if (introBlock) {
        section.style.setProperty('--intro-opacity', String(introOpacity));
        section.style.setProperty('--intro-shift-y', `${introShiftY}px`);
        introBlock.dataset.homeIntroVisible = introOpacity > 0.08 ? 'true' : 'false';
      }
    };

    const schedule = () => {
      if (!frame && !document.hidden) {
        frame = requestAnimationFrame(tick);
      }
    };

    const measure = () => {
      width = scene.clientWidth || window.innerWidth || 1440;
      height = scene.clientHeight || window.innerHeight || 900;
      const reduced = Boolean(motion?.matches);
      reducedMotionRef.current = reduced;
      enabled = !preview && supportsCollectionReveal(reduced);

      section.dataset.revealEnabled = enabled ? 'true' : 'false';
      const surfaceEl = collectionSurface.current;
      surfaceEl?.setAttribute('data-reveal-enabled', enabled ? 'true' : 'false');
      surfaceEl?.style.removeProperty('transform');
      collectionRevealSpacer.current?.setAttribute(
        'data-reveal-enabled',
        enabled ? 'true' : 'false',
      );

      introTop = section.getBoundingClientRect().top + window.scrollY;
      introHeight = introBlock ? introBlock.offsetHeight : 0;

      if (enabled) {
        if (section.offsetHeight > 2 * height) {
          introTravel = section.offsetHeight - 2 * height;
        } else if (section.offsetHeight > height) {
          introTravel = section.offsetHeight - height;
        } else {
          introTravel = Math.round((width < 768 ? 2.2 : 3) * height);
        }
      } else if (section.offsetHeight > height) {
        introTravel = section.offsetHeight - height;
      } else {
        introTravel = Math.round((width < 768 ? 2.2 : 3) * height);
      }
      introTravel = Math.max(1, introTravel);

      revealStart = introTop + introTravel;
      revealEnd = enabled ? revealStart + height : revealStart;
      const nextScrollStartOffset = enabled ? revealEnd : undefined;

      if (revealEnabledRef.current !== enabled) {
        revealEnabledRef.current = enabled;
        setRevealEnabled(enabled);
      }
      if (scrollStartOffsetRef.current !== nextScrollStartOffset) {
        scrollStartOffsetRef.current = nextScrollStartOffset;
        setScrollStartOffset(nextScrollStartOffset);
      }

      const restFrame = heroEarthPose(width, height, 0.78, introHeight);
      const earthRight = restFrame.centerX + restFrame.diameter / 2;
      section.style.setProperty('--earth-right', `${earthRight}px`);
      section.style.setProperty('--intro-left', `${earthRight + Math.min(96, width * 0.06)}px`);
      scene.style.setProperty('--globe-base', `${restFrame.fullDiameter}px`);
      scene.dataset.viewportMode = restFrame.mode;

      snapNext = true;
      revealSnapNext = true;
      paintedVisualProgress = Number.NaN;
      renderedYaw = Number.NaN;
      paintedRevealState = '';
      paintedRevealProgress = '';
      paintedClipPath = null;
      paintedInert = null;
      paintedStageOffset = Number.NaN;
      paintedEarthCovered = null;
      tick(performance.now());
    };

    function tick(now: number) {
      frame = 0;
      const scroll = Math.max(0, window.scrollY);
      const visible = scroll < introTop + introTravel + height && scroll + height > introTop;
      const speed =
        visible && Number.isFinite(paintedScroll) ? Math.abs(scroll - paintedScroll) : 0;
      paintedScroll = scroll;

      const targetProgress = clamp((scroll - introTop) / introTravel);
      const reduced = Boolean(motion?.matches);
      reducedMotionRef.current = reduced;

      if (
        !Number.isFinite(visualProgress) ||
        snapNext ||
        reduced ||
        (!visible && targetProgress === 1)
      ) {
        visualProgress = targetProgress;
        snapNext = false;
        previousSmoothTime = 0;
      } else {
        const dtMs = previousSmoothTime > 0 ? Math.min(50, now - previousSmoothTime) : 16.67;
        previousSmoothTime = now;
        const alpha = 1 - Math.pow(1 - 0.22, Math.max(0.25, dtMs / 16.6667));
        const nextProgress = visualProgress + (targetProgress - visualProgress) * alpha;
        visualProgress =
          Math.abs(targetProgress - nextProgress) < 0.0002 ? targetProgress : nextProgress;
      }

      const smoothing = Math.abs(targetProgress - visualProgress) >= 0.0002;
      if (!smoothing) {
        previousSmoothTime = 0;
      }
      const changed = visualProgress !== paintedVisualProgress;

      if (changed) {
        paintedVisualProgress = visualProgress;
        paintState(visualProgress);
      }

      const targetReveal = computeCollectionRevealState(scroll, revealStart, height, enabled);
      if (!enabled) {
        visualRevealProgress = 1;
        revealSnapNext = false;
        previousRevealTime = 0;
      } else if (!Number.isFinite(visualRevealProgress) || revealSnapNext || reduced) {
        visualRevealProgress = targetReveal.progress;
        revealSnapNext = false;
        previousRevealTime = 0;
      } else {
        const dtMs =
          previousRevealTime > 0 ? Math.min(50, Math.max(4, now - previousRevealTime)) : 16.67;
        previousRevealTime = now;
        visualRevealProgress = stepSmoothProgress(
          visualRevealProgress,
          targetReveal.progress,
          dtMs,
          REVEAL_SMOOTH_FACTOR,
        );
      }

      const revealSmoothing =
        enabled && Math.abs(targetReveal.progress - visualRevealProgress) >= 0.0002;
      if (!revealSmoothing) {
        previousRevealTime = 0;
      }

      const visualState: CollectionRevealState = !enabled
        ? 'revealed'
        : visualRevealProgress <= 0
          ? 'hidden'
          : visualRevealProgress >= 1
            ? 'revealed'
            : 'revealing';
      const visualComplete = visualState === 'revealed';

      const surfaceEl = collectionSurface.current;
      const progressText = visualRevealProgress.toFixed(4);
      revealStateRef.current = visualState;
      revealProgressRef.current = progressText;

      if (surfaceEl) {
        if (paintedRevealState !== visualState) {
          paintedRevealState = visualState;
          surfaceEl.dataset.revealState = visualState;
        }
        if (paintedRevealProgress !== progressText) {
          paintedRevealProgress = progressText;
          surfaceEl.dataset.revealProgress = progressText;
        }

        const clipPath =
          enabled && visualState === 'hidden'
            ? formatRevealClipPath(0, height)
            : enabled && visualState === 'revealing'
              ? formatRevealClipPath(
                  getRevealRadius(visualRevealProgress, width, height),
                  height,
                  Math.max(0, scroll - revealEnd),
                )
              : '';

        if (paintedClipPath !== clipPath) {
          paintedClipPath = clipPath;
          if (clipPath) {
            surfaceEl.style.clipPath = clipPath;
            surfaceEl.style.setProperty('-webkit-clip-path', clipPath);
          } else {
            surfaceEl.style.removeProperty('clip-path');
            surfaceEl.style.removeProperty('-webkit-clip-path');
          }
        }

        const shouldBeInert = enabled && !visualComplete;
        if (paintedInert !== shouldBeInert) {
          paintedInert = shouldBeInert;
          if (shouldBeInert) {
            surfaceEl.inert = true;
            surfaceEl.setAttribute('inert', '');
            surfaceEl.setAttribute('aria-hidden', 'true');
          } else {
            surfaceEl.inert = false;
            surfaceEl.removeAttribute('inert');
            surfaceEl.removeAttribute('aria-hidden');
          }
        }

        if (
          shouldBeInert &&
          document.activeElement instanceof HTMLElement &&
          surfaceEl.contains(document.activeElement)
        ) {
          document.activeElement.blur();
        }
      }

      if (!preview && revealCompleteRef.current !== visualComplete) {
        revealCompleteRef.current = visualComplete;
        setRevealComplete(visualComplete);
      }

      const stageOffset = enabled && !visualComplete && scroll > revealEnd ? scroll - revealEnd : 0;
      if (paintedStageOffset !== stageOffset) {
        paintedStageOffset = stageOffset;
        if (stageOffset > 0) {
          scene.style.transform = `translate3d(0, ${stageOffset}px, 0)`;
        } else {
          scene.style.removeProperty('transform');
        }
      }

      const earthCovered = enabled ? visualComplete : scroll >= introTop + introTravel + height;
      if (paintedEarthCovered !== earthCovered) {
        paintedEarthCovered = earthCovered;
        scene.dataset.earthHidden = earthCovered ? 'true' : 'false';
        scene.style.setProperty('--earth-opacity', earthCovered ? '0' : '1');
      }

      const inPartialReveal = enabled && visualState === 'revealing';
      if (inPartialReveal && document.activeElement === hit) {
        hit.blur();
      }
      earthLockedRef.current = inPartialReveal || earthCovered;
      if (earthLockedRef.current && drag) {
        drag = undefined;
        delete hit.dataset.dragging;
      }

      const earthActive =
        (visible || (enabled && !visualComplete && scroll + height > introTop)) && !earthCovered;
      if (!wasEarthActive && earthActive) {
        renderedYaw = Number.NaN;
      }
      wasEarthActive = earthActive;
      const shouldPauseStars = inPartialReveal || earthCovered;
      starsPausedRef.current = shouldPauseStars;
      stars.current?.setPaused(shouldPauseStars);
      stars.current?.setSpeedMultiplier(
        reduced || !earthActive || inPartialReveal ? 1 : 1 + 0.12 * clamp(speed / 32),
      );

      const spinning =
        earthActive &&
        !inPartialReveal &&
        Boolean(renderer) &&
        !reduced &&
        !drag?.active &&
        !document.hidden;
      if (spinning && previousSpinTime) {
        yaw += Math.min(now - previousSpinTime, 50) * EARTH_SPEED * ease((now - resumeAt) / 450);
      }
      previousSpinTime = spinning ? now : 0;

      // Pause WebGL rendering once covered, offscreen, or hidden
      if (renderer && earthActive && !document.hidden && (changed || yaw !== renderedYaw)) {
        renderer.render(width, height, pose.diameter, pose.centerY, yaw, pose.centerX);
        renderedYaw = yaw;
        if (!scene.dataset.webgl) scene.dataset.webgl = 'ready';
      }

      if ((spinning || smoothing || revealSmoothing) && !document.hidden) {
        schedule();
      }
    }

    const focusFeaturesHeading = () => {
      const heading = document.getElementById('features-heading');
      if (heading instanceof HTMLElement) {
        heading.focus({ preventScroll: true });
      }
    };

    const ensureInitialFragmentHeadingFocus = () => {
      if (
        !abort.signal.aborted &&
        !preview &&
        window.location.hash === '#features' &&
        revealStateRef.current === 'revealed' &&
        (!document.activeElement ||
          document.activeElement === document.body ||
          document.activeElement === document.documentElement)
      ) {
        focusFeaturesHeading();
      }
    };

    const jumpToCollection = (focusHeading = true) => {
      if (preview) return;
      measure();
      const featuresEl = document.getElementById('features');
      const featuresTop = featuresEl ? featuresEl.getBoundingClientRect().top + window.scrollY : 0;
      const targetTop = enabled
        ? revealEnd
        : featuresTop > 0
          ? featuresTop
          : introTop + introTravel + height;
      window.scrollTo({ top: targetTop, behavior: 'auto' });
      snapNext = true;
      revealSnapNext = true;
      paintedVisualProgress = Number.NaN;
      tick(performance.now());
      if (focusHeading) {
        focusFeaturesHeading();
        if (typeof window.requestAnimationFrame === 'function') {
          cancelAnimationFrame(focusFrame);
          focusFrame = window.requestAnimationFrame(() => {
            focusFrame = 0;
            ensureInitialFragmentHeadingFocus();
          });
        }
      }
    };

    const returnHome = () => {
      if (window.location.hash === '#features') {
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}`,
        );
      }
      window.scrollTo({ top: 0, behavior: 'auto' });
      mainRef.current?.focus({ preventScroll: true });
      snapNext = true;
      revealSnapNext = true;
      schedule();
    };

    actionsRef.current = {
      jumpToCollection,
      returnHome,
      schedule,
    };

    const finishDrag = () => {
      if (drag?.active) resumeAt = performance.now() + 800;
      drag = undefined;
      delete hit.dataset.dragging;
      schedule();
    };

    hit.addEventListener(
      'pointerdown',
      (event) => {
        if (!event.isPrimary || event.button !== 0 || !renderer || earthLockedRef.current) return;
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY, yaw, active: false };
      },
      options,
    );

    window.addEventListener(
      'pointermove',
      (event) => {
        if (!drag || drag.id !== event.pointerId) return;
        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (!drag.active) {
          if (Math.abs(dy) > 8 && Math.abs(dy) >= Math.abs(dx)) {
            finishDrag();
            return;
          }
          if (Math.abs(dx) <= 8) return;
          drag.active = true;
          hit.dataset.dragging = 'true';
          hit.setPointerCapture(event.pointerId);
        }
        yaw = drag.yaw + (dx / Math.max(1, width)) * Math.PI;
        schedule();
      },
      options,
    );

    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture'] as const) {
      window.addEventListener(
        name,
        (event) => {
          if (event.pointerId === drag?.id) finishDrag();
        },
        options,
      );
    }

    hit.addEventListener(
      'keydown',
      (event) => {
        if (
          !renderer ||
          earthLockedRef.current ||
          (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')
        ) {
          return;
        }
        event.preventDefault();
        yaw += event.key === 'ArrowRight' ? 0.12 : -0.12;
        schedule();
      },
      options,
    );

    window.addEventListener('scroll', schedule, { ...options, passive: true });
    window.addEventListener('resize', measure, options);
    window.addEventListener('orientationchange', measure, options);
    window.addEventListener(
      'hashchange',
      () => {
        if (!preview && window.location.hash === '#features') {
          jumpToCollection(true);
        }
      },
      options,
    );

    document.addEventListener(
      'visibilitychange',
      () => {
        previousSpinTime = 0;
        previousSmoothTime = 0;
        previousRevealTime = 0;
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else {
          schedule();
        }
      },
      options,
    );

    motion?.addEventListener?.(
      'change',
      () => {
        measure();
      },
      options,
    );

    surface.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
        renderer?.dispose();
        renderer = undefined;
        delete scene.dataset.webgl;
        finishDrag();
      },
      options,
    );

    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    observer?.observe(section);
    observer?.observe(scene);
    if (introBlock) {
      observer?.observe(introBlock);
    }

    measure();
    if (!preview && window.location.hash === '#features') {
      jumpToCollection(true);
      if (document.readyState !== 'complete') {
        window.addEventListener('load', ensureInitialFragmentHeadingFocus, {
          ...options,
          once: true,
        });
      }
    }

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (!abort.signal.aborted) {
          measure();
        }
      });
    }

    void import('./earth-scene')
      .then(({ createEarthScene }) => {
        if (!abort.signal.aborted) {
          return createEarthScene(surface, width < 768, abort.signal);
        }
        return undefined;
      })
      .then((result) => {
        if (!result) return;
        if (abort.signal.aborted) {
          result.dispose();
        } else {
          renderer = result;
          renderedYaw = Number.NaN;
          schedule();
        }
      })
      .catch(() => {
        if (!abort.signal.aborted) {
          delete scene.dataset.webgl;
        }
      });

    return () => {
      actionsRef.current = null;
      abort.abort();
      observer?.disconnect();
      cancelAnimationFrame(frame);
      cancelAnimationFrame(focusFrame);
      renderer?.dispose();
    };
  }, [preview]);

  return (
    <main ref={mainRef} tabIndex={-1} data-theme="cosmos" data-home-journey className={styles.page}>
      {preview ? null : (
        <a href="#features" onClick={handleSkipToCollection} className={styles.skipLink}>
          Skip to collection
        </a>
      )}

      <Starfield onEngineReady={setStars} />

      <section
        ref={intro}
        data-reveal-enabled={preview ? 'false' : revealEnabled ? 'true' : 'false'}
        className={styles.intro}
        aria-label="Introduction"
      >
        <div ref={stage} className={styles.stage}>
          <div className={styles.earthHalo} aria-hidden="true" />
          <picture className={styles.poster}>
            <source media="(max-width: 767px)" srcSet="/earth/earth-poster-2k.webp" />
            <img src="/earth/earth-poster-2k.webp" alt="" />
          </picture>
          <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
          <div className={styles.flare} aria-hidden="true" />
          <div
            ref={target}
            data-earth-bounds
            className={styles.globeInput}
            role="group"
            tabIndex={0}
            aria-label="Earth. Drag horizontally or use Left and Right arrow keys to rotate."
          />

          {preview ? null : (
            <div
              ref={introCol}
              data-home-intro
              data-home-intro-visible="false"
              className={styles.introColumn}
              aria-label="Meet Hiep"
            >
              <span className={styles.introEyebrow}>{HOME_INTRO_COPY.eyebrow}</span>
              <h2 className={styles.introHeading}>
                <span className={styles.introHeadingGreeting}>Hi! I&apos;m </span>
                <span className={styles.introHeadingName}>Hiep.</span>
              </h2>
              <p className={styles.introLead}>
                First-year <strong>Advanced Program in Computer Science</strong> at{' '}
                <strong>HCMUS.</strong>
              </p>
              <p className={styles.introBody}>
                Passionate about <strong>AI</strong>, <strong>Machine Learning</strong>, and their
                applications. I enjoy solving problems, exploring new technologies, and turning
                ideas into real projects.
              </p>
              <p className={styles.introClosing}>{HOME_INTRO_COPY.closing}</p>
            </div>
          )}

          <div className={styles.navScrim} aria-hidden="true" />

          <h1 className={styles.wordmark}>
            <Image
              src="/brand/wordmark.svg"
              width={1200}
              height={430}
              alt="Hiep Trong Space"
              priority
              unoptimized
            />
          </h1>
        </div>

        <div className={styles.bell}>
          {preview ? <Bell size={20} aria-hidden="true" /> : <BellButton tone="cosmos" />}
        </div>
      </section>

      {preview ? (
        <section className={styles.collection} aria-labelledby="preview-features-heading">
          <h2 id="preview-features-heading" className={styles.collectionHeading}>
            Explore my space
          </h2>
          <p>The feature collection begins here in the motion preview.</p>
        </section>
      ) : (
        <>
          <div
            ref={collectionSurface}
            data-reveal-enabled={revealEnabled ? 'true' : 'false'}
            data-reveal-state={revealComplete ? 'revealed' : 'hidden'}
            data-reveal-progress="0.0000"
            className={styles.collectionSurface}
          >
            <div className={styles.midnightStars} aria-hidden="true" />
            <header className={styles.collectionTopbar}>
              <div className={styles.collectionTopbarInner}>
                <button
                  type="button"
                  data-collection-home
                  onClick={handleReturnHome}
                  aria-label="Hiep Trong Space home"
                  className={styles.collectionSignature}
                >
                  <span className={styles.collectionSignatureText}>Hiep Trong</span>
                  <StarIcon size={10} className={styles.collectionSignatureStar} />
                </button>
              </div>
            </header>
            <FeatureCollection
              revealState={revealComplete ? 'revealed' : 'hidden'}
              revealComplete={revealComplete}
              scrollStartOffset={scrollStartOffset}
            />
            <HomeFooter />
          </div>
          <div
            ref={collectionRevealSpacer}
            data-reveal-enabled={revealEnabled ? 'true' : 'false'}
            aria-hidden="true"
            className={styles.collectionRevealSpacer}
          />
        </>
      )}
    </main>
  );
}
