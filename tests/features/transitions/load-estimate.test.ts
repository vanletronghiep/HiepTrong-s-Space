import { describe, expect, it } from 'vitest';
import {
  ASSET_FETCH_MS,
  DEFAULT_COLD_MS,
  DEFAULT_WARM_MS,
  FAST_PATH_MAX_MS,
  MAX_DRAW_MS,
  MIN_DRAW_MS,
  decideLoadPath,
  estimateLoadMs,
  parseLoadHistory,
  recordLoadMs,
} from '@/features/transitions/load-estimate';

describe('route load estimate (v3.2)', () => {
  it('defaults to a slow cold estimate and a fast warm estimate when there is no history', () => {
    const base = { history: {}, pathname: '/events', assetCached: true };
    expect(estimateLoadMs({ ...base, kind: 'cold' })).toBe(DEFAULT_COLD_MS);
    expect(estimateLoadMs({ ...base, kind: 'warm' })).toBe(DEFAULT_WARM_MS);
  });

  it('keeps cold and warm samples separate and adds the asset cost to uncached warm routes', () => {
    const history = { '/events': { cold: 2000, warm: 120 } };
    expect(estimateLoadMs({ history, pathname: '/events', kind: 'cold', assetCached: false })).toBe(
      2000,
    );
    expect(estimateLoadMs({ history, pathname: '/events', kind: 'warm', assetCached: true })).toBe(
      120,
    );
    expect(estimateLoadMs({ history, pathname: '/events', kind: 'warm', assetCached: false })).toBe(
      120 + ASSET_FETCH_MS,
    );
  });

  it('takes the fast path for very short estimates and scales the drawing to the estimate', () => {
    expect(decideLoadPath(FAST_PATH_MAX_MS)).toEqual({ path: 'fast' });
    expect(decideLoadPath(100)).toEqual({ path: 'fast' });
    expect(decideLoadPath(1500)).toEqual({ path: 'draw', drawMs: 1500 });
    // A short-but-not-instant estimate still draws, never faster than the minimum.
    expect(decideLoadPath(FAST_PATH_MAX_MS + 1)).toEqual({ path: 'draw', drawMs: MIN_DRAW_MS });
    expect(decideLoadPath(60_000)).toEqual({ path: 'draw', drawMs: MAX_DRAW_MS });
  });

  it('records a moving average per route and kind without touching the other kind', () => {
    let history = recordLoadMs({}, '/events', 'cold', 1000);
    expect(history['/events']).toEqual({ cold: 1000 });
    history = recordLoadMs(history, '/events', 'cold', 2000);
    expect(history['/events']?.cold).toBe(1400);
    history = recordLoadMs(history, '/events', 'warm', 150);
    expect(history['/events']).toEqual({ cold: 1400, warm: 150 });
    expect(recordLoadMs(history, '/events', 'cold', Number.NaN)).toBe(history);
    expect(recordLoadMs({}, '/x', 'cold', 999_999)['/x']?.cold).toBe(8000);
  });

  it('parses stored history defensively', () => {
    expect(parseLoadHistory(null)).toEqual({});
    expect(parseLoadHistory('not json')).toEqual({});
    expect(parseLoadHistory('[1,2]')).toEqual({});
    expect(
      parseLoadHistory('{"/events":{"cold":900,"warm":"x"},"/bad":5,"/tasks/daily":{"warm":80}}'),
    ).toEqual({ '/events': { cold: 900 }, '/tasks/daily': { warm: 80 } });
  });
});
