'use client';

import { useEffect, useId, useRef, type SVGProps } from 'react';
import styles from './daily-foundation.module.css';

const sparkle = 'M0 -8Q1 -1 8 0Q1 1 0 8Q-1 1 -8 0Q-1 -1 0 -8Z';
const zodiac = [
  'M12 21V12C12 1 2 2 3 9M12 12C12 1 22 2 21 9',
  'M3 3c2 0 4 5 9 5s7-5 9-5M18 14a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z',
  'M4 4c5 2 11 2 16 0M4 20c5-2 11-2 16 0M8 6v12m8-12v12',
  'M4 10c3-5 8-6 15-4M9 9a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM20 14c-3 5-8 6-15 4m10-3a3 3 0 1 1 6 0 3 3 0 0 1-6 0Z',
  'M8 14C4 5 10 1 15 4c6 4-3 12 0 16 2 3 5 0 5-2M9 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  'M3 6c4-3 4 1 4 5v8M7 10c2-5 6-7 6 0v8m0-8c3-5 6-6 6 0 0 6-3 10-6 11m3-4 5 4',
  'M3 20h18M3 16h6c-5-5-1-10 3-10s8 5 3 10h6',
  'M3 6c4-3 4 1 4 5v8M7 10c2-5 6-7 6 0v9m0-9c3-5 6-6 6 0v7c0 3 2 3 4 0m-3-1 3 1-1 3',
  'm4 21 16-17m-8 0h8v8M7 11l6 6',
  'M3 7c4-2 5 2 5 6v7m0-8c3-7 8-8 8-3 0 4-5 7-3 10 3 5 10-1 7-4-2-2-5 0-6 2',
  'm3 10 5-4 3 4 5-4 4 4M3 17l5-4 3 4 5-4 4 4',
  'M5 4c7 5 7 11 0 16M19 4c-7 5-7 11 0 16M3 12h18',
];

function Astrolabe() {
  return (
    <svg viewBox="-220 -220 440 440" fill="none" stroke="currentColor">
      {[71, 81, 99, 108, 139, 177, 195, 207, 214].map((radius) => (
        <circle key={radius} r={radius} strokeWidth={radius > 190 ? 0.9 : 0.65} />
      ))}
      {Array.from({ length: 72 }, (_, index) => (
        <path
          key={index}
          d={index % 6 === 0 ? 'M0 -177v69' : 'M0 -207v4'}
          transform={`rotate(${index * 5})`}
        />
      ))}
      {zodiac.map((sign, index) => (
        <path
          key={sign}
          d={sign}
          transform={`rotate(${index * 30 + 15}) translate(-9 -167) scale(.76)`}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity=".72"
        />
      ))}
      {Array.from({ length: 48 }, (_, index) => (
        <path
          key={index}
          d="M0 -28Q4 -50 0 -70Q-3 -52 0 -28"
          transform={`rotate(${index * 7.5})`}
          strokeWidth=".65"
        />
      ))}
      <circle r="28" strokeWidth="1.2" />
    </svg>
  );
}

const cornerSigns = [6, 7, 8, 2, 9, 10, 11, 0, 1, 3, 4, 5] as const;
const cornerCurl = 'M11 20c0-4-1-6-4-7-6-2-4-8 1-7 5 1 5 7 3 10m0-6c4-6 10-2 8 2-1 3-6 3-7 0';

function ZodiacCorner() {
  return (
    <svg
      x="976"
      y="-20"
      width="420"
      height="420"
      viewBox="-220 -220 440 440"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g opacity=".34" strokeWidth=".8">
        {[27, 64, 70, 80, 87, 105, 115, 161, 207, 214].map((radius) => (
          <circle key={radius} r={radius} />
        ))}
        {Array.from({ length: 12 }, (_, index) => (
          <path
            key={index}
            d="M0 -207v46m0 46v28m0 17v39"
            transform={`rotate(${4 - index * 30})`}
          />
        ))}
        {Array.from({ length: 72 }, (_, index) => (
          <path
            key={index}
            d="M0 -114v3M0 -86v2"
            transform={`rotate(${index * 5})`}
            strokeWidth=".6"
          />
        ))}
      </g>
      <g opacity=".64">
        {cornerSigns.map((sign, index) => (
          <g key={sign} transform={`rotate(${-8 - index * 26})`}>
            <path
              d={sign === 8 ? cornerCurl : zodiac[sign]}
              transform="translate(-14 -197) scale(1.16)"
              strokeWidth="2.05"
            />
            <path
              d={zodiac[sign]}
              transform="translate(-4 -101) scale(.34)"
              strokeWidth="2"
              opacity=".7"
            />
          </g>
        ))}
      </g>
      <g opacity=".32">
        <circle r="23" fill="var(--daily-planet)" strokeWidth="1" />
        {Array.from({ length: 60 }, (_, index) => (
          <path
            key={index}
            d={index % 3 === 0 ? 'M0 -23Q2 -41 0 -63' : 'M0 -23Q-1.7 -39 0 -50'}
            transform={`rotate(${index * 6})`}
            strokeWidth={index % 3 === 0 ? '.82' : '.55'}
          />
        ))}
      </g>
    </svg>
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
  const glint = useId();
  return (
    <svg className={styles.bottomSky} data-daily-bottom-art viewBox="0 0 1186 190" fill="none">
      <defs>
        <radialGradient id={cloud}>
          <stop stopColor="var(--daily-planet)" stopOpacity=".63" />
          <stop offset=".48" stopColor="var(--daily-arc-line)" stopOpacity=".31" />
          <stop offset="1" stopColor="var(--daily-arc-line)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={glint}>
          <stop stopColor="var(--ws-surface)" stopOpacity=".98" />
          <stop offset=".31" stopColor="var(--daily-shooting-star)" stopOpacity=".35" />
          <stop offset="1" stopColor="var(--daily-shooting-star)" stopOpacity="0" />
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
      <g color="var(--daily-shooting-star)" opacity=".55">
        <path d="m785 173 170-55" stroke="currentColor" strokeWidth=".6" />
        {[
          [132, 113, 14],
          [790, 169, 9],
          [954, 118, 10],
        ].map(([x, y, r]) => (
          <circle key={x} cx={x} cy={y} r={r} fill={`url(#${glint})`} />
        ))}
        <path d={sparkle} transform="translate(132 113) scale(.64)" fill="var(--ws-surface)" />
        <path d={sparkle} transform="translate(954 118) scale(.38)" fill="var(--ws-surface)" />
      </g>
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

export function DailySky() {
  const layer = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = layer.current;
    const update = () => {
      if (element) element.dataset.paused = String(document.hidden);
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return (
    <div ref={layer} className={styles.sky} aria-hidden="true">
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
      <div className={styles.galaxy} />
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
            className={styles.twinkle}
            cx={(index * 367 + 25) % 1396}
            cy={(index * 193 + 17) % 935}
            r={index % 7 === 0 ? 1.15 : 0.7}
            style={{ animationDelay: `${-(index % 13)}s` }}
            fill="currentColor"
          />
        ))}
        {[
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
        ].map(([x, y], index) => (
          <path
            key={`${x}-${y}`}
            d={sparkle}
            transform={`translate(${x} ${y}) scale(${index % 3 === 0 ? 1 : 0.58})`}
            className={styles.twinkle}
            style={{ animationDelay: `${-index}s` }}
            fill="currentColor"
          />
        ))}
      </svg>
    </div>
  );
}
