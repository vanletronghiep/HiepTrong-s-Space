'use client';

import Image from 'next/image';
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { HomeFooter } from '@/features/home/HomeFooter';
import { clamp, ease, EARTH_SPEED, INITIAL_EARTH_YAW, mix } from '@/features/home/home-journey';
import { Starfield } from '@/features/home/starfield/Starfield';
import type { StarfieldEngine } from '@/features/home/starfield/starfield-engine';
import { PILOT_INTRO_COPY, getPilotViewportMode, pilotEarthPose } from './homepage-pilot-fixtures';
import { PilotBellFixture } from './PilotBellFixture';
import { PilotFeatureCollection } from './PilotFeatureCollection';
import styles from './homepage-pilot.module.css';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function HomepagePilotPrototype() {
  const intro = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const introCol = useRef<HTMLDivElement>(null);
  const stars = useRef<StarfieldEngine | null>(null);

  const setStars = useCallback((engine: StarfieldEngine | null) => {
    stars.current = engine;
  }, []);

  useIsomorphicLayoutEffect(() => {
    const rawSection = intro.current;
    const rawScene = stage.current;
    const rawSurface = canvas.current;
    const rawHit = target.current;
    const rawIntroBlock = introCol.current;
    if (!rawSection || !rawScene || !rawSurface || !rawHit || !rawIntroBlock) return undefined;

    const section: HTMLElement = rawSection;
    const scene: HTMLDivElement = rawScene;
    const surface: HTMLCanvasElement = rawSurface;
    const hit: HTMLDivElement = rawHit;
    const introBlock: HTMLDivElement = rawIntroBlock;

    const motion =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    const abort = new AbortController();
    const options = { signal: abort.signal };

    let renderer:
      Awaited<ReturnType<typeof import('./earth-scene-pilot').createPilotEarthScene>> | undefined;
    let frame = 0;
    let previousSpinTime = 0;
    let previousSmoothTime = 0;
    let paintedScroll = Number.NaN;
    let visualProgress = Number.NaN;
    let paintedVisualProgress = Number.NaN;
    let renderedYaw = Number.NaN;
    let pose = pilotEarthPose(1440, 900, 0, 0);
    let yaw = INITIAL_EARTH_YAW;
    let resumeAt = 0;
    let width = 0;
    let height = 0;
    let introTop = 0;
    let introHeight = 0;
    let travel = 1;
    let snapNext = true;
    let drag: { id: number; x: number; y: number; yaw: number; active: boolean } | undefined;

    section.dataset.pilotHydrated = 'true';
    scene.dataset.pilotHydrated = 'true';

    const paintState = (progress: number) => {
      const phone = width < 768;
      const mode = getPilotViewportMode(width, height);
      const compactLandscape = mode === 'landscape-compact';

      const p1 = clamp(progress / 0.44);
      const p2 = clamp((progress - 0.44) / 0.34);
      const p3 = clamp((progress - 0.78) / 0.22);

      pose = pilotEarthPose(width, height, progress, introHeight);
      const rawEarthOpacity = 1 - ease(p3 * 1.3);
      const earthOpacity = rawEarthOpacity <= 0.005 ? 0 : rawEarthOpacity;

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

      const fadeIn = motion?.matches ? (p2 >= 0.15 ? 1 : 0) : ease((p2 - 0.05) / 0.4);
      const fadeOut = motion?.matches ? (p3 <= 0.75 ? 1 : 0) : 1 - ease((p3 - 0.35) / 0.5);
      const introOpacity = fadeIn * fadeOut;
      const introShiftY = motion?.matches ? 0 : (1 - ease((p2 - 0.05) / 0.55)) * 16;

      scene.style.setProperty('--earth-tx', `${earthTx}px`);
      scene.style.setProperty('--earth-ty', `${earthTy}px`);
      scene.style.setProperty('--earth-scale', String(earthScale));
      scene.style.setProperty('--poster-tx', `${posterTx}px`);
      scene.style.setProperty('--poster-ty', `${posterTy}px`);
      scene.style.setProperty('--poster-scale', String(posterScale));
      scene.style.setProperty('--earth-opacity', String(earthOpacity));
      scene.style.setProperty('--flare-tx', `${flareTx}px`);
      scene.style.setProperty('--flare-ty', `${flareTy}px`);
      scene.style.setProperty('--flare-scale', String(flareScale));
      scene.style.setProperty('--flare-opacity', String(1 - ease(p1 / 0.8)));

      section.style.setProperty('--logo-x', `${logoX}px`);
      section.style.setProperty('--logo-y', `${logoY}px`);
      section.style.setProperty('--logo-scale', String(logoWidth / 1200));
      section.style.setProperty('--nav-scrim', String(ease((progress - 0.72) / 0.28)));
      section.style.setProperty('--intro-opacity', String(introOpacity));
      section.style.setProperty('--intro-shift-y', `${introShiftY}px`);
      introBlock.dataset.pilotIntroVisible = introOpacity > 0.08 ? 'true' : 'false';

      return earthOpacity;
    };

    const schedule = () => {
      if (!frame && !document.hidden) {
        frame = requestAnimationFrame(tick);
      }
    };

    const measure = () => {
      width = scene.clientWidth || window.innerWidth || 1440;
      height = scene.clientHeight || window.innerHeight || 900;
      introTop = section.getBoundingClientRect().top + window.scrollY;
      introHeight = introBlock.offsetHeight;
      travel = Math.max(1, section.offsetHeight - height);

      const restFrame = pilotEarthPose(width, height, 0.78, introHeight);
      scene.style.setProperty('--globe-base', `${restFrame.fullDiameter}px`);
      scene.dataset.pilotViewportMode = restFrame.mode;

      snapNext = true;
      paintedVisualProgress = Number.NaN;
      tick(performance.now());
    };

    function tick(now: number) {
      frame = 0;
      const scroll = Math.max(0, window.scrollY);
      const visible = scroll < introTop + travel + height && scroll + height > introTop;
      const speed =
        visible && Number.isFinite(paintedScroll) ? Math.abs(scroll - paintedScroll) : 0;
      paintedScroll = scroll;

      const targetProgress = clamp((scroll - introTop) / travel);
      const reduced = Boolean(motion?.matches);

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
      const changed = visualProgress !== paintedVisualProgress;
      let earthOpacity = 0;

      if (changed) {
        paintedVisualProgress = visualProgress;
        earthOpacity = paintState(visualProgress);
      } else {
        const p3 = clamp((visualProgress - 0.78) / 0.22);
        const rawOpacity = 1 - ease(p3 * 1.3);
        earthOpacity = rawOpacity <= 0.005 ? 0 : rawOpacity;
      }

      const earthActive = visible && earthOpacity > 0.005;
      stars.current?.setSpeedMultiplier(reduced || !earthActive ? 1 : 1 + 0.12 * clamp(speed / 32));

      const spinning = earthActive && Boolean(renderer) && !reduced && !drag?.active;
      if (spinning && previousSpinTime) {
        yaw += Math.min(now - previousSpinTime, 50) * EARTH_SPEED * ease((now - resumeAt) / 450);
      }
      previousSpinTime = spinning ? now : 0;

      // Pause WebGL rendering once earthOpacity <= 0.005 or offscreen
      if (renderer && earthActive && (changed || yaw !== renderedYaw)) {
        renderer.render(width, height, pose.diameter, pose.centerY, yaw, pose.centerX);
        renderedYaw = yaw;
        if (!scene.dataset.webgl) scene.dataset.webgl = 'ready';
      }

      if (spinning || smoothing) {
        schedule();
      } else {
        previousSmoothTime = 0;
      }
    }

    const finishDrag = () => {
      if (drag?.active) resumeAt = performance.now() + 800;
      drag = undefined;
      delete hit.dataset.dragging;
      schedule();
    };

    hit.addEventListener(
      'pointerdown',
      (event) => {
        if (!event.isPrimary || event.button !== 0 || !renderer) return;
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
        if (!renderer || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
        event.preventDefault();
        yaw += event.key === 'ArrowRight' ? 0.12 : -0.12;
        schedule();
      },
      options,
    );

    window.addEventListener('scroll', schedule, { ...options, passive: true });
    window.addEventListener('resize', measure, options);

    document.addEventListener(
      'visibilitychange',
      () => {
        previousSpinTime = 0;
        previousSmoothTime = 0;
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else {
          schedule();
        }
      },
      options,
    );

    motion?.addEventListener(
      'change',
      () => {
        snapNext = true;
        paintedVisualProgress = Number.NaN;
        schedule();
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
    observer?.observe(introBlock);

    measure();

    if (typeof document !== 'undefined' && document.fonts?.ready) {
      void document.fonts.ready.then(() => {
        if (!abort.signal.aborted) {
          measure();
        }
      });
    }

    void import('./earth-scene-pilot')
      .then(({ createPilotEarthScene }) => {
        if (!abort.signal.aborted) {
          return createPilotEarthScene(surface, width < 768, abort.signal);
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
        delete scene.dataset.webgl;
      });

    return () => {
      abort.abort();
      observer?.disconnect();
      cancelAnimationFrame(frame);
      renderer?.dispose();
    };
  }, []);

  return (
    <main
      data-theme="cosmos"
      data-home-journey
      data-pilot-route="homepage-pilot"
      className={styles.page}
    >
      <Starfield onEngineReady={setStars} />

      <div data-pilot-badge className={styles.pilotBadge} aria-hidden="true">
        <span className={styles.pilotBadgeDot} />
        <span>Pilot Preview</span>
      </div>

      <section ref={intro} className={styles.intro} aria-label="Introduction">
        <div ref={stage} className={styles.stage}>
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
        </div>

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

        <div className={styles.bell}>
          <PilotBellFixture />
        </div>

        <div
          ref={introCol}
          data-pilot-intro
          data-pilot-intro-visible="false"
          className={styles.introColumn}
          aria-label="Meet Hiep"
        >
          <div role="heading" aria-level={2} className={styles.introHeading}>
            <span className={styles.introHeadingGreeting}>Hi! </span>
            <span className={styles.introHeadingName}>I&apos;m Hiep.</span>
          </div>
          <p className={styles.introLead}>{PILOT_INTRO_COPY.lead}</p>
          <p className={styles.introBody}>{PILOT_INTRO_COPY.body}</p>
          <p className={styles.introClosing}>{PILOT_INTRO_COPY.closing}</p>
        </div>
      </section>

      <PilotFeatureCollection />
      <HomeFooter />
    </main>
  );
}
