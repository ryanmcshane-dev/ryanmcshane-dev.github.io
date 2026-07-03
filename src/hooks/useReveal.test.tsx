import { describe, it, expect, afterEach } from 'vitest';
import { act, render, renderHook } from '@testing-library/react';
import { useReveal } from './useReveal';

/** Install a mock IntersectionObserver capturing its options + callback for assertions. */
function installMockObserver() {
  const state: { options?: IntersectionObserverInit; callback?: IntersectionObserverCallback } = {};

  class MockObserver {
    constructor(cb: IntersectionObserverCallback, options?: IntersectionObserverInit) {
      state.callback = cb;
      state.options = options;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }

  const original = window.IntersectionObserver;
  window.IntersectionObserver = MockObserver as unknown as typeof IntersectionObserver;
  globalThis.IntersectionObserver = window.IntersectionObserver;
  return {
    state,
    restore: () => {
      window.IntersectionObserver = original;
      globalThis.IntersectionObserver = original;
    },
  };
}

/** Probe that binds the reveal ref to a real DOM node (so the observer is actually created). */
function Probe() {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  return <div ref={ref} data-testid="probe" data-visible={isVisible} />;
}

describe('useReveal', () => {
  it('returns a ref and an initial visibility flag', () => {
    const { result } = renderHook(() => useReveal());
    expect(result.current).toHaveProperty('ref');
    expect(typeof result.current.isVisible).toBe('boolean');
  });

  describe('with a mocked IntersectionObserver', () => {
    let mock: ReturnType<typeof installMockObserver>;
    afterEach(() => mock.restore());

    it('observes with threshold 0 so sections taller than the viewport still reveal', () => {
      // Regression guard: a fractional threshold (e.g. 0.15) can never be reached by an element
      // taller than ~1/threshold viewports, leaving opacity:0 content permanently hidden — the
      // bug that blanked the Job Radar page.
      mock = installMockObserver();
      render(<Probe />);
      expect(mock.state.options?.threshold).toBe(0);
    });

    it('reveals when the observer reports the element intersecting', () => {
      mock = installMockObserver();
      const { getByTestId } = render(<Probe />);
      expect(getByTestId('probe').getAttribute('data-visible')).toBe('false');
      act(() => {
        mock.state.callback?.(
          [{ isIntersecting: true, target: getByTestId('probe') } as unknown as IntersectionObserverEntry],
          {} as IntersectionObserver,
        );
      });
      expect(getByTestId('probe').getAttribute('data-visible')).toBe('true');
    });
  });

  it('reveals immediately when IntersectionObserver is unavailable', () => {
    const original = window.IntersectionObserver;
    // @ts-expect-error - deliberately remove for the fallback path
    delete window.IntersectionObserver;
    // @ts-expect-error - global mirror
    delete globalThis.IntersectionObserver;

    const { result } = renderHook(() => useReveal());
    expect(result.current.isVisible).toBe(true);

    window.IntersectionObserver = original;
    globalThis.IntersectionObserver = original;
  });
});
