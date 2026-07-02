import { type RefObject, useEffect, useRef, useState } from 'react';

interface UseRevealOptions {
  /** Fraction of the element visible before revealing. */
  threshold?: number;
  /** Reveal only once, then stop observing. */
  once?: boolean;
  rootMargin?: string;
}

/**
 * Reveal-on-scroll: returns a ref and a boolean. Attach the ref to an element and
 * use `isVisible` to trigger enter animations. Respects prefers-reduced-motion by
 * revealing immediately. Falls back to visible if IntersectionObserver is missing.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseRevealOptions = {},
): { ref: RefObject<T>; isVisible: boolean } {
  const { threshold = 0.15, once = true, rootMargin = '0px 0px -10% 0px' } = options;
  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return { ref, isVisible };
}
