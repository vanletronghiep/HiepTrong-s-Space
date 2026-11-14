'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/ui/cn';
import { StarfieldEngine, type StarfieldQuality } from './starfield-engine';

export interface StarfieldProps {
  mode?: 'fixed' | 'absolute';
  enableParallax?: boolean;
  initialQuality?: StarfieldQuality;
  speedMultiplier?: number;
  trailStrength?: number;
  paused?: boolean;
  onEngineReady?: (engine: StarfieldEngine | null) => void;
  className?: string;
}

export function Starfield({
  mode = 'fixed',
  enableParallax = true,
  initialQuality = 'high',
  speedMultiplier = 1,
  trailStrength = 1,
  paused,
  onEngineReady,
  className,
}: StarfieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<StarfieldEngine | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const mediaQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;

    const engine = new StarfieldEngine({
      canvas,
      reducedMotion: mediaQuery?.matches ?? false,
      enableParallax,
      initialQuality,
      paused: paused ?? false,
    });
    engineRef.current = engine;
    onEngineReady?.(engine);

    const handleMotionChange = (event: MediaQueryListEvent) => {
      engine.setReducedMotion(event.matches);
    };

    mediaQuery?.addEventListener?.('change', handleMotionChange);

    return () => {
      mediaQuery?.removeEventListener?.('change', handleMotionChange);
      onEngineReady?.(null);
      engine.destroy();
      engineRef.current = null;
    };
    // `paused` updates via `setPaused` below without recreating the engine.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableParallax, initialQuality, onEngineReady]);

  useEffect(() => {
    engineRef.current?.setSpeedMultiplier(speedMultiplier);
  }, [speedMultiplier]);

  useEffect(() => {
    engineRef.current?.setTrailStrength(trailStrength);
  }, [trailStrength]);

  useEffect(() => {
    if (paused !== undefined) {
      engineRef.current?.setPaused(paused);
    }
  }, [paused]);

  useEffect(() => {
    engineRef.current?.start();
  }, [enableParallax, initialQuality, onEngineReady]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-testid="starfield-canvas"
      className={cn(
        'pointer-events-none inset-0 h-full w-full block',
        mode === 'fixed' ? 'fixed' : 'absolute',
        className,
      )}
    />
  );
}
