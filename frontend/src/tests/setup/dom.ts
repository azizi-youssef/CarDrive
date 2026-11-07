/**
 * Préparation des tests de composants (à importer en tête de chaque `*.spec.tsx`,
 * avec le commentaire `// @vitest-environment jsdom`).
 * - matchers DOM (`toBeInTheDocument`, `toHaveFocus`, `toHaveAccessibleName`…) ;
 * - démontage entre deux tests ;
 * - API de navigateur absentes de jsdom, remplacées par des versions neutres.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
  document.body.removeAttribute('style');
});

if (typeof window !== 'undefined') {
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => undefined,
        removeListener: () => undefined,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList;
  }
  if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => undefined;
  if (!Element.prototype.scrollTo) Element.prototype.scrollTo = () => undefined;
  if (!('IntersectionObserver' in window)) {
    class NoopIntersectionObserver {
      readonly root = null;
      readonly rootMargin = '';
      readonly thresholds = [];
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return [];
      }
    }
    Object.assign(window, { IntersectionObserver: NoopIntersectionObserver });
  }
  if (!('ResizeObserver' in window)) {
    class NoopResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    Object.assign(window, { ResizeObserver: NoopResizeObserver });
  }
}
