'use client';

import { createContext, useContext, type ReactNode } from 'react';
import Image from 'next/image';
import styles from './feature-theme.module.css';

export const FEATURE_ART = {
  'tasks-hub': ['starlight-hourglass', 'quiet-telescope'],
  notification: ['sakura-branch', 'fairy-glass-chime'],
  events: ['manta-in-the-current', 'hermit-shell-haven'],
  'ai-engineering': ['mist-layered-ridges', 'trail-cairn'],
  'blogs-hub': ['woodland-cabin', 'cabin-lantern'],
  'apcs-hub': ['glacier-shelf', 'snow-fox-rest'],
  flashcards: ['library-arched-window', 'reading-corner'],
  'entertainment-hub': ['dream-city-horizon', 'dream-console'],
  tracking: ['herbal-tea-ritual', 'garden-watering-can'],
  project: ['dragon-over-the-ridge', 'wooden-training-dummy'],
  'learning-room': ['bonsai-on-a-stone', 'meditation-cushion'],
  'personal-achievements': ['marble-arcade', 'ceremonial-marble-plinth'],
  'annual-milestones': ['hall-of-golden-years', 'champions-cup'],
} as const;

export type FeatureThemeName = keyof typeof FEATURE_ART;
const ThemeContext = createContext<FeatureThemeName | undefined>(undefined);
export const useFeatureTheme = () => useContext(ThemeContext);

export function FeatureThemeProvider({
  name,
  children,
}: {
  name: FeatureThemeName;
  children: ReactNode;
}) {
  return <ThemeContext.Provider value={name}>{children}</ThemeContext.Provider>;
}

export function FeatureTheme({ name, children }: { name: FeatureThemeName; children: ReactNode }) {
  return (
    <FeatureThemeProvider name={name}>
      <div data-feature-theme={name} className={styles.frame}>
        <Image
          className={styles.headerArt}
          src={`/visuals/${name}/${FEATURE_ART[name][0]}.svg`}
          alt=""
          aria-hidden="true"
          width={240}
          height={150}
          unoptimized
        />
        <div className={styles.content}>{children}</div>
      </div>
    </FeatureThemeProvider>
  );
}

export function FeatureEmptyState({ title, description }: { title: string; description?: string }) {
  const theme = useFeatureTheme();
  return (
    <div className={styles.empty} role="status">
      {theme && (
        <Image
          src={`/visuals/${theme}/${FEATURE_ART[theme][1]}.svg`}
          alt=""
          aria-hidden="true"
          width={160}
          height={140}
          unoptimized
        />
      )}
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  );
}
