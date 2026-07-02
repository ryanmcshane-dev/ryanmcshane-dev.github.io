import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ThemeProvider, useTheme } from './useTheme';

function wrapper({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('throws when used outside a provider', () => {
    // Suppress the expected error boundary noise.
    expect(() => renderHook(() => useTheme())).toThrow(/ThemeProvider/);
  });

  it('toggles between light and dark and reflects it on <html>', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    const initial = result.current.theme;

    act(() => result.current.toggleTheme());
    expect(result.current.theme).not.toBe(initial);
    expect(document.documentElement.getAttribute('data-theme')).toBe(result.current.theme);
  });

  it('persists the chosen theme to localStorage', () => {
    const { result } = renderHook(() => useTheme(), { wrapper });
    act(() => result.current.setTheme('dark'));
    expect(localStorage.getItem('theme')).toBe('dark');
    act(() => result.current.setTheme('light'));
    expect(localStorage.getItem('theme')).toBe('light');
  });
});
