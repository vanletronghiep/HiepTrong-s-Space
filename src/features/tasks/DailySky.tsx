'use client';

import { useEffect, useId, useRef, useState, type SVGProps } from 'react';
import { useReducedMotion } from 'motion/react';
import { useIsTransitioning } from '@/features/transitions/TransitionProvider';
import styles from './daily-foundation.module.css';

const sparkle = 'M0 -8Q1 -1 8 0Q1 1 0 8Q-1 1 -8 0Q-1 -1 0 -8Z';
const ZODIAC_WHEEL_URL = '/visuals/daily-v2/zodiac-wheel.svg';

function Astrolabe() {
  return (
    <svg viewBox="0 0 700 700" aria-hidden="true">
      <image
        data-daily-zodiac="upper-left"
        href={ZODIAC_WHEEL_URL}
        width="700"
        height="700"
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}

function ZodiacCorner() {
  return (
    <image
      data-daily-zodiac="lower-right"
      href={ZODIAC_WHEEL_URL}
      x="976"
      y="-20"
      width="420"
      height="420"
      opacity=".64"
      preserveAspectRatio="xMidYMid meet"
    />
  );
}

export function DailyRingedPlanet(props: SVGProps<SVGSVGElement>) {
  const shade = useId();
  return (
    <svg viewBox="0 0 188 96" fill="none" stroke="currentColor" aria-hidden="true" {...props}>
      <defs>
        <radialGradient id={shade} cx=".34" cy=".31" r=".7">
          <stop stopColor="var(--ws-surface)" />
          <stop offset=".74" stopColor="var(--daily-planet)" />
          <stop offset="1" stopColor="var(--daily-arc-line)" />
        </radialGradient>
      </defs>
      <g transform="rotate(-23 94 48)" strokeWidth=".85">
        <ellipse cx="94" cy="48" rx="87" ry="20" opacity=".64" />
        <ellipse cx="94" cy="48" rx="75" ry="15" opacity=".5" />
        <ellipse cx="94" cy="48" rx="63" ry="11" strokeDasharray="1 3" opacity=".36" />
        <circle cx="94" cy="44" r="19" fill={`url(#${shade})`} stroke="none" />
        <path d="M7 48a87 20 0 0 0 174 0M19 48a75 15 0 0 0 150 0" opacity=".6" />
        <circle cx="164" cy="35" r="3.6" fill="currentColor" stroke="none" />
      </g>
      <path
        d={sparkle}
        transform="translate(172 22) scale(.45)"
        fill="currentColor"
        stroke="none"
        opacity=".52"
      />
    </svg>
  );
}

const bottomStars = [
  [42, 46],
  [51, 77],
  [72, 167],
  [115, 40],
  [174, 88],
  [185, 109],
  [253, 67],
  [285, 98],
  [319, 98],
  [424, 117],
  [536, 92],
  [569, 115],
  [581, 100],
  [605, 159],
  [656, 78],
  [691, 129],
  [775, 146],
  [836, 157],
  [864, 115],
  [888, 96],
  [913, 112],
  [944, 140],
  [968, 159],
  [1009, 51],
  [1056, 78],
];

function BottomSky() {
  const cloud = useId();
  return (
    <svg className={styles.bottomSky} data-daily-bottom-art viewBox="0 0 1186 190" fill="none">
      <defs>
        <radialGradient id={cloud}>
          <stop stopColor="var(--daily-planet)" stopOpacity=".63" />
          <stop offset=".48" stopColor="var(--daily-arc-line)" stopOpacity=".31" />
          <stop offset="1" stopColor="var(--daily-arc-line)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className={styles.clouds} opacity=".62" fill={`url(#${cloud})`}>
        {[
          [282, 127, 64, 33],
          [326, 146, 76, 43],
          [371, 163, 75, 36],
          [418, 176, 84, 30],
          [449, 179, 74, 32],
          [851, 185, 108, 32],
          [942, 155, 62, 25],
          [975, 172, 53, 26],
        ].map(([x, y, rx, ry]) => (
          <ellipse key={x} cx={x} cy={y} rx={rx} ry={ry} transform={`rotate(18 ${x} ${y})`} />
        ))}
      </g>
      <g stroke="currentColor" opacity=".28" strokeWidth=".82">
        <path d="M-20 4C67 -2 137 61 138 155c0 22-5 41-13 54M-20 13C60 7 128 66 129 156c0 22-5 39-12 52" />
        <ellipse cx="153" cy="167" rx="142" ry="43" transform="rotate(19 153 167)" />
        <ellipse
          cx="153"
          cy="167"
          rx="126"
          ry="32"
          transform="rotate(19 153 167)"
          strokeDasharray="3 2"
        />
      </g>
      <DailyRingedPlanet x="65" y="126" width="140" height="82" opacity=".52" />
      <DailyRingedPlanet x="647" y="66" width="156" height="80" opacity=".54" />
      <ZodiacCorner />
      <g fill="currentColor" opacity=".48">
        {bottomStars.map(([x, y], i) => (
          <circle key={x} cx={x} cy={y} r={i % 4 === 0 ? 1.05 : 0.67} />
        ))}
        {[
          [63, 30, 0.66],
          [30, 143, 0.68],
          [424, 117, 0.59],
          [864, 116, 0.49],
          [888, 96, 0.45],
          [1097, 134, 0.35],
        ].map(([x, y, scale]) => (
          <path key={x} d={sparkle} transform={`translate(${x} ${y}) scale(${scale})`} />
        ))}
        <path d={sparkle} transform="translate(332 146) scale(.53)" fill="var(--ws-surface)" />
      </g>
    </svg>
  );
}

export function OrbitPlanetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="5" />
      <ellipse cx="12" cy="12" rx="11" ry="3.1" transform="rotate(-28 12 12)" />
    </svg>
  );
}

const SPARKLE_STARS = [
  [90, 141],
  [25, 310],
  [85, 518],
  [42, 722],
  [68, 930],
  [1070, 96],
  [1368, 22],
  [1370, 110],
  [1376, 356],
  [1322, 650],
  [1345, 756],
  [788, 96],
] as const;

const STATIC_SPARKLES = SPARKLE_STARS.map(
  ([x, y], index) => [x, y, index % 3 === 0 ? 1 : 0.58, index] as const,
).filter(([, , , index]) => index % 3 === 1);

const TWINKLE_SPARKLES = SPARKLE_STARS.map(
  ([x, y], index) => [x, y, index % 3 === 0 ? 1 : 0.58, index] as const,
).filter(([, , , index]) => index % 3 !== 1);

export function DailySky() {
  const layer = useRef<HTMLDivElement>(null);
  const isTransitioning = useIsTransitioning();
  const reducedMotion = useReducedMotion();
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const element = layer.current;
    const update = () => {
      if (element) element.dataset.paused = String(document.hidden);
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    if (isTransitioning || reducedMotion) {
      setAnimated(false);
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setAnimated(true);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [isTransitioning, reducedMotion]);

  return (
    <div
      ref={layer}
      className={styles.sky}
      data-animated={animated ? 'true' : 'false'}
      aria-hidden="true"
    >
      <svg className={styles.nebula} viewBox="0 0 1400 1100" preserveAspectRatio="none">
        <defs>
          <radialGradient id="daily-nebula-pale">
            <stop stopColor="var(--ws-surface)" stopOpacity=".96" />
            <stop offset="1" stopColor="var(--ws-surface)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="daily-nebula-lavender">
            <stop stopColor="var(--daily-violet)" stopOpacity=".38" />
            <stop offset="1" stopColor="var(--daily-violet)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <g className={styles.clouds}>
          <ellipse cx="46" cy="70" rx="173" ry="174" fill="url(#daily-nebula-lavender)" />
          <ellipse cx="142" cy="6" rx="155" ry="133" fill="url(#daily-nebula-pale)" />
          <ellipse cx="82" cy="130" rx="103" ry="97" fill="url(#daily-nebula-pale)" />
        </g>
      </svg>
      <div className={styles.astrolabe}>
        <Astrolabe />
      </div>
      <div className={styles.upperPlanet} />
      <div className={styles.nebulaBank} />
      <BottomSky />
      <svg
        className={styles.constellationLeft}
        viewBox="0 0 100 94"
        fill="none"
        stroke="currentColor"
      >
        <path d="m10 10 52 15 30 18-39 19-16 18-27-34z" strokeDasharray="2 2" />
        {[
          [10, 10],
          [62, 25],
          [92, 43],
          [53, 62],
          [37, 80],
          [10, 46],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.7" fill="currentColor" />
        ))}
      </svg>
      <svg
        className={styles.constellationRight}
        viewBox="0 0 115 156"
        fill="none"
        stroke="currentColor"
      >
        <path d="m8 44 31-35 46 27-11 45 29 40" strokeDasharray="3 3" />
        {[
          [8, 44],
          [39, 9],
          [85, 36],
          [74, 81],
          [103, 121],
        ].map(([x, y]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.8" fill="currentColor" />
        ))}
      </svg>
      <svg
        className={styles.constellationMid}
        viewBox="0 0 96 100"
        fill="none"
        stroke="currentColor"
      >
        <path d="m86 9-59 29-12 36" strokeDasharray="2 2" />
        <circle cx="86" cy="9" r="2" fill="currentColor" />
        <circle cx="27" cy="38" r="2" fill="currentColor" />
      </svg>
      <svg className={styles.stars} viewBox="0 0 1400 1120" preserveAspectRatio="none">
        {Array.from({ length: 114 }, (_, index) => (
          <circle
            key={index}
            cx={(index * 367 + 25) % 1396}
            cy={(index * 193 + 17) % 935}
            r={index % 7 === 0 ? 1.15 : 0.7}
            fill="currentColor"
          />
        ))}
        {STATIC_SPARKLES.map(([x, y, scale]) => (
          <path
            key={`${x}-${y}`}
            d={sparkle}
            transform={`translate(${x} ${y}) scale(${scale})`}
            fill="currentColor"
          />
        ))}
      </svg>
      {TWINKLE_SPARKLES.map(([x, y, scale, index]) => (
        <span
          key={`${x}-${y}`}
          className={styles.twinkle}
          style={{
            left: `${(x / 1400) * 100}%`,
            top: `${(y / 1120) * 100}%`,
            transform: `translate3d(-50%, -50%, 0) scale(${scale})`,
            animationDelay: `${-index}s`,
          }}
        >
          <svg width="16" height="16" viewBox="-8 -8 16 16" aria-hidden="true">
            <path d={sparkle} fill="currentColor" fillOpacity="0.63" />
          </svg>
        </span>
      ))}
    </div>
  );
}
