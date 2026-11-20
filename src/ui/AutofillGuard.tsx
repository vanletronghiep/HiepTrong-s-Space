'use client';

import { useEffect } from 'react';

const FIELD_SELECTOR = 'form, input, textarea, select';

/**
 * Sets `autocomplete="off"` on every form and field under `root`, so the browser never offers
 * saved entries, input history, or autofill. Application-rendered suggestion menus are untouched.
 */
export function disableAutofill(root: ParentNode): void {
  const fields: Element[] = [];
  if (root instanceof Element && root.matches(FIELD_SELECTOR)) fields.push(root);
  fields.push(...root.querySelectorAll(FIELD_SELECTOR));
  for (const field of fields) {
    if (field.getAttribute('autocomplete') !== 'off') field.setAttribute('autocomplete', 'off');
  }
}

/** Applies the no-autofill rule to the whole document, including fields mounted later. */
export function AutofillGuard() {
  useEffect(() => {
    disableAutofill(document);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          disableAutofill(mutation.target as Element);
          continue;
        }
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) disableAutofill(node);
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['autocomplete'],
    });
    return () => observer.disconnect();
  }, []);

  return null;
}
