import { FEATURE_REGISTRY, type FeatureEntry } from '@/features/registry';

export const ZODIAC_PREVIEW_FEATURES: readonly FeatureEntry[] = FEATURE_REGISTRY.filter(
  (feature) => feature.id !== 'tasks-hub',
);
