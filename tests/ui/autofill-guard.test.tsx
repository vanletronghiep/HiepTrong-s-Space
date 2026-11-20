// @vitest-environment jsdom
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { AutofillGuard, disableAutofill } from '@/ui/AutofillGuard';

afterEach(cleanup);

const flushObserver = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe('AutofillGuard', () => {
  it('turns off autocomplete on existing forms and fields, overriding other values', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <form><input type="text" /><input type="password" autocomplete="current-password" /></form>
      <textarea></textarea>
      <select><option>a</option></select>
      <input list="choices" /><datalist id="choices"><option value="x"></option></datalist>`;

    disableAutofill(root);

    for (const field of root.querySelectorAll('form, input, textarea, select')) {
      expect(field.getAttribute('autocomplete')).toBe('off');
    }
    // App-defined suggestions stay intact.
    expect(root.querySelector('input[list="choices"]')).not.toBeNull();
    expect(root.querySelectorAll('datalist option')).toHaveLength(1);
  });

  it('covers fields mounted later and attributes changed later', async () => {
    render(<AutofillGuard />);

    const input = document.createElement('input');
    document.body.append(input);
    await flushObserver();
    expect(input.getAttribute('autocomplete')).toBe('off');

    input.setAttribute('autocomplete', 'email');
    await flushObserver();
    expect(input.getAttribute('autocomplete')).toBe('off');

    input.remove();
  });
});
