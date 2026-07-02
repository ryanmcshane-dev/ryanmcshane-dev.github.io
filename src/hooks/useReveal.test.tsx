import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useReveal } from './useReveal';

describe('useReveal', () => {
  it('returns a ref and an initial visibility flag', () => {
    const { result } = renderHook(() => useReveal());
    expect(result.current).toHaveProperty('ref');
    expect(typeof result.current.isVisible).toBe('boolean');
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
