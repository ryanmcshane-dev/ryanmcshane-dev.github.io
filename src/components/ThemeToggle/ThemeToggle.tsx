import { useTheme } from '@/hooks/useTheme';
import styles from './ThemeToggle.module.css';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <circle cx="12" cy="12" r="4.2" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="12" y1="2.5" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="21.5" />
            <line x1="2.5" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="21.5" y2="12" />
            <line x1="5.1" y1="5.1" x2="6.8" y2="6.8" />
            <line x1="17.2" y1="17.2" x2="18.9" y2="18.9" />
            <line x1="18.9" y1="5.1" x2="17.2" y2="6.8" />
            <line x1="6.8" y1="17.2" x2="5.1" y2="18.9" />
          </g>
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
          <path
            fill="currentColor"
            d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
          />
        </svg>
      )}
    </button>
  );
}
