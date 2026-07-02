import { siteConfig } from '@/config';
import styles from './SocialLinks.module.css';

interface SocialLinksProps {
  /** Show text labels next to icons. */
  showLabels?: boolean;
  className?: string;
}

const iconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  'aria-hidden': true,
  focusable: false,
} as const;

export function SocialLinks({ showLabels = false, className }: SocialLinksProps) {
  return (
    <ul className={[styles.list, className].filter(Boolean).join(' ')}>
      <li>
        <a className={styles.link} href={siteConfig.links.email}>
          <svg {...iconProps}>
            <path
              fill="currentColor"
              d="M3 5.5A1.5 1.5 0 0 1 4.5 4h15A1.5 1.5 0 0 1 21 5.5v13A1.5 1.5 0 0 1 19.5 20h-15A1.5 1.5 0 0 1 3 18.5v-13Zm2.2.5 6.8 5.1L18.8 6H5.2ZM19 7.6l-6.4 4.8a1 1 0 0 1-1.2 0L5 7.6V18h14V7.6Z"
            />
          </svg>
          {showLabels && <span>Email</span>}
          <span className={styles.srOnly}>Email Ryan McShane</span>
        </a>
      </li>
      <li>
        <a
          className={styles.link}
          href={siteConfig.links.linkedin}
          target="_blank"
          rel="noreferrer noopener"
        >
          <svg {...iconProps}>
            <path
              fill="currentColor"
              d="M6.94 5a2 2 0 1 1-4.001-.001A2 2 0 0 1 6.94 5ZM3 8.5h3.87V21H3V8.5Zm6.35 0h3.71v1.7h.05c.52-.95 1.78-1.95 3.67-1.95 3.93 0 4.65 2.44 4.65 5.6V21h-3.87v-5.4c0-1.29-.02-2.95-1.8-2.95-1.8 0-2.08 1.4-2.08 2.85V21H9.35V8.5Z"
            />
          </svg>
          {showLabels && <span>LinkedIn</span>}
          <span className={styles.srOnly}>Ryan McShane on LinkedIn</span>
        </a>
      </li>
      <li>
        <a
          className={styles.link}
          href={siteConfig.links.github}
          target="_blank"
          rel="noreferrer noopener"
        >
          <svg {...iconProps}>
            <path
              fill="currentColor"
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49v-1.9c-2.78.62-3.37-1.22-3.37-1.22-.46-1.18-1.11-1.5-1.11-1.5-.9-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.36-2.22-.26-4.56-1.14-4.56-5.06 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.4 9.4 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.93-2.35 4.8-4.58 5.05.36.32.68.94.68 1.9v2.82c0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z"
            />
          </svg>
          {showLabels && <span>GitHub</span>}
          <span className={styles.srOnly}>Ryan McShane on GitHub</span>
        </a>
      </li>
    </ul>
  );
}
