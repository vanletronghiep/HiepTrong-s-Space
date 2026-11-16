'use client';

import { useCallback, useState, type RefObject } from 'react';
import { useFeatureTheme, type FeatureThemeName } from './FeatureTheme';

export interface OverlayThemeAttributes {
  'data-theme': 'workspace';
  'data-feature-theme'?: FeatureThemeName;
}

/**
 * Reads the active workspace/feature theme from context and the nearest DOM ancestor
 * so portaled popovers inherit CSS tokens cleanly even when mounted in `document.body`.
 */
export function useOverlayTheme(triggerRef: RefObject<Element | null>): {
  themeAttributes: OverlayThemeAttributes;
  refreshTheme: () => void;
} {
  const contextTheme = useFeatureTheme();
  const [domTheme, setDomTheme] = useState<FeatureThemeName | undefined>(contextTheme);

  const refreshTheme = useCallback(() => {
    const el = triggerRef.current;
    if (!el || typeof el.closest !== 'function') {
      setDomTheme(contextTheme);
      return;
    }
    const themedAncestor = el.closest('[data-feature-theme]');
    const rawAttr = themedAncestor?.getAttribute('data-feature-theme');
    setDomTheme((rawAttr as FeatureThemeName | null) ?? contextTheme);
  }, [contextTheme, triggerRef]);

  const resolvedTheme = domTheme ?? contextTheme;

  return {
    themeAttributes: {
      'data-theme': 'workspace',
      ...(resolvedTheme ? { 'data-feature-theme': resolvedTheme } : {}),
    },
    refreshTheme,
  };
}
