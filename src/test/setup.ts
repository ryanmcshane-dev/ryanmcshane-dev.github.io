import '@testing-library/jest-dom/vitest';
import { afterEach, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

afterEach(() => {
  cleanup();
});

// jsdom does not implement scrollTo (it throws); ScrollManager calls it on route
// changes, so replace it with a no-op spy.
Object.defineProperty(window, 'scrollTo', {
  writable: true,
  configurable: true,
  value: vi.fn(),
});

// jsdom does not implement matchMedia; provide a controllable stub so components
// that read prefers-color-scheme / prefers-reduced-motion don't throw.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

// jsdom lacks IntersectionObserver; the reveal-on-scroll hook depends on it.
if (!('IntersectionObserver' in window)) {
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds = [];
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = () => [];
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
  Object.defineProperty(globalThis, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });
}
