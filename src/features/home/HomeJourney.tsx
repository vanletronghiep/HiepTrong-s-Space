'use client';

import { BellButton } from '@/features/notifications/BellButton';
import { FeatureCollection } from './feature-collection/FeatureCollection';
import { HomeFooter } from './HomeFooter';
import Image from 'next/image';
import { Bell } from 'lucide-react';
import { useCallback, useEffect, useRef } from 'react';
import { clamp, earthPose, ease, EARTH_SPEED, INITIAL_EARTH_YAW, mix } from './home-journey';
import { Starfield } from './starfield/Starfield';
import type { StarfieldEngine } from './starfield/starfield-engine';
import styles from './home-journey.module.css';

export function HomeJourney({ preview = false }: { preview?: boolean }) {
  const intro = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const target = useRef<HTMLDivElement>(null);
  const stars = useRef<StarfieldEngine | null>(null);
  const setStars = useCallback((engine: StarfieldEngine | null) => {
    stars.current = engine;
  }, []);

  useEffect(() => {
    const section = intro.current!;
    const scene = stage.current!;
    const surface = canvas.current!;
    const hit = target.current!;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const abort = new AbortController();
    const options = { signal: abort.signal };
    let renderer: Awaited<ReturnType<typeof import('./earth-scene').createEarthScene>> | undefined;
    let frame = 0;
    let previous = 0;
    let paintedScroll = Number.NaN;
    let paintedProgress = Number.NaN;
    let renderedYaw = Number.NaN;
    let pose = earthPose(0, 0, 0);
    let yaw = INITIAL_EARTH_YAW;
    let resumeAt = 0;
    let width = 0;
    let height = 0;
    let introTop = 0;
    let travel = 1;
    let drag: { id: number; x: number; y: number; yaw: number; active: boolean } | undefined;

    const schedule = () => {
      if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const measure = () => {
      width = scene.clientWidth;
      height = scene.clientHeight;
      introTop = section.getBoundingClientRect().top + window.scrollY;
      travel = Math.max(1, section.offsetHeight - height);
      paintedProgress = Number.NaN;
      schedule();
    };

    function tick(now: number) {
      frame = 0;
      const scroll = Math.max(0, window.scrollY);
      const visible = scroll < introTop + travel + height && scroll + height > introTop;
      const speed =
        visible && Number.isFinite(paintedScroll) ? Math.abs(scroll - paintedScroll) : 0;
      stars.current?.setSpeedMultiplier(motion.matches ? 1 : 1 + 0.12 * clamp(speed / 32));
      paintedScroll = scroll;
      const progress = clamp((scroll - introTop) / travel);
      const changed = progress !== paintedProgress;
      if (changed) {
        paintedProgress = progress;
        pose = earthPose(width, height, progress);
        const phone = width < 768;
        const logo = ease(progress / 0.66);
        const openingWidth = Math.min(width * (phone ? 0.88 : 0.78), height * 1.0605, 1120);
        const logoWidth = mix(openingWidth, phone ? 132 : 200, logo);
        scene.style.setProperty('--earth-size', pose.diameter + 'px');
        scene.style.setProperty('--earth-y', pose.centerY + 'px');
        scene.style.setProperty('--flare-y', pose.centerY - pose.diameter / 2 + 'px');
        scene.style.setProperty('--flare-opacity', String(1 - ease(progress / 0.5)));
        section.style.setProperty(
          '--logo-x',
          mix((width - openingWidth) / 2, phone ? 16 : 24, logo) + 'px',
        );
        section.style.setProperty(
          '--logo-y',
          mix(height * (phone ? 0.18 : 0.16), phone ? 14 : 16, logo) + 'px',
        );
        section.style.setProperty('--logo-scale', String(logoWidth / 1200));
        section.style.setProperty('--nav-scrim', String(ease((progress - 0.72) / 0.28)));
      }

      const spinning = visible && Boolean(renderer) && !motion.matches && !drag?.active;
      if (spinning && previous) {
        yaw += Math.min(now - previous, 50) * EARTH_SPEED * ease((now - resumeAt) / 450);
      }
      previous = spinning ? now : 0;
      if (renderer && visible && (changed || yaw !== renderedYaw)) {
        renderer.render(width, height, pose.diameter, pose.centerY, yaw);
        renderedYaw = yaw;
        if (!scene.dataset.webgl) scene.dataset.webgl = 'ready';
      }
      if (spinning) schedule();
      else stars.current?.setSpeedMultiplier(1);
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
        yaw = drag.yaw + (dx / width) * Math.PI;
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
        previous = 0;
        if (document.hidden) {
          cancelAnimationFrame(frame);
          frame = 0;
        } else schedule();
      },
      options,
    );
    motion.addEventListener(
      'change',
      () => {
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

    const observer = new ResizeObserver(measure);
    observer.observe(section);
    observer.observe(scene);
    measure();
    void import('./earth-scene')
      .then(({ createEarthScene }) => {
        if (!abort.signal.aborted) return createEarthScene(surface, width < 768, abort.signal);
      })
      .then((result) => {
        if (abort.signal.aborted) result?.dispose();
        else {
          renderer = result;
          schedule();
        }
      })
      .catch(() => {
        delete scene.dataset.webgl;
      });

    return () => {
      abort.abort();
      observer.disconnect();
      cancelAnimationFrame(frame);
      renderer?.dispose();
    };
  }, []);

  return (
    <main data-theme="cosmos" data-home-journey className={styles.page}>
      <Starfield onEngineReady={setStars} />
      <section ref={intro} className={styles.intro} aria-label="Introduction">
        <div ref={stage} className={styles.stage}>
          <picture className={styles.poster}>
            <source media="(max-width: 767px)" srcSet="/earth/earth-poster-2k.webp" />
            <img src="/earth/earth-poster-4k.webp" alt="" />
          </picture>
          <canvas ref={canvas} className={styles.canvas} aria-hidden="true" />
          <div className={styles.flare} aria-hidden="true" />
          <div
            ref={target}
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
          <FeatureCollection />
          <HomeFooter />
        </>
      )}
    </main>
  );
}
