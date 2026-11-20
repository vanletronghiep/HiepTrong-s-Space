// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { FocusModality } from '@/ui/FocusModality';

afterEach(cleanup);

const hasFlag = () => document.documentElement.hasAttribute('data-keyboard-nav');

describe('FocusModality', () => {
  it('ignores modifier-only keys', () => {
    render(<FocusModality />);
    for (const key of ['Shift', 'Control', 'Alt', 'Meta', '', 'Unidentified']) {
      fireEvent.keyDown(document.body, { key });
    }
    expect(hasFlag()).toBe(false);
  });

  it('turns on for navigation keys and off again on pointer press', () => {
    render(<FocusModality />);
    fireEvent.keyDown(document.body, { key: 'Tab', shiftKey: true });
    expect(hasFlag()).toBe(true);
    fireEvent.pointerDown(document.body);
    expect(hasFlag()).toBe(false);
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(<FocusModality />);
    fireEvent.keyDown(document.body, { key: 'Tab' });
    unmount();
    expect(hasFlag()).toBe(false);
  });
});
