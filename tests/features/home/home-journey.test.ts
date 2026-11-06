import { describe, expect, it } from 'vitest';
import { earthPose, EARTH_SPEED } from '@/features/home/home-journey';

describe('Homepage Earth journey', () => {
  it.each([
    [1440, 900, 0.58, 2, 522],
    [390, 844, 0.6, 2.2, 327.6],
  ])(
    'frames the opening crop and full globe at %i × %i',
    (width, height, crest, scale, fullSize) => {
      const opening = earthPose(width, height, 0);
      const middle = earthPose(width, height, 0.29);
      const full = earthPose(width, height, 0.58);
      expect(opening.centerY - opening.diameter / 2).toBeCloseTo(height * crest);
      expect(opening.diameter).toBeCloseTo(width * scale);
      expect(middle.diameter).toBeLessThan(opening.diameter);
      expect(middle.diameter).toBeGreaterThan(full.diameter);
      expect(full.diameter).toBeCloseTo(fullSize);
      expect(full.centerY + full.diameter / 2).toBeLessThan(height);
      expect(earthPose(width, height, 1)).toEqual(full);
      expect(earthPose(width, height, -1)).toEqual(opening);
    },
  );

  it('completes one revolution per minute of active frame time', () => {
    expect(EARTH_SPEED * 60_000).toBeCloseTo(2 * Math.PI);
  });
});
