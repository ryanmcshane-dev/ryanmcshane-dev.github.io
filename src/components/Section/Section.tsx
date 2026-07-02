import type { ReactNode } from 'react';
import { Container } from '@/components/Container/Container';
import { useReveal } from '@/hooks/useReveal';
import styles from './Section.module.css';

interface SectionProps {
  id: string;
  /** Small mono label above the heading. */
  eyebrow?: string;
  title?: string;
  /** Short supporting line under the heading. */
  intro?: ReactNode;
  children: ReactNode;
  /** Alternate background to separate adjacent sections. */
  tone?: 'default' | 'subtle';
  /** Constrain header + content to prose width. */
  narrow?: boolean;
  className?: string;
  /** Accessible label when there is no visible title. */
  ariaLabel?: string;
}

export function Section({
  id,
  eyebrow,
  title,
  intro,
  children,
  tone = 'default',
  narrow = false,
  className,
  ariaLabel,
}: SectionProps) {
  const { ref, isVisible } = useReveal<HTMLDivElement>();
  const headingId = `${id}-title`;

  const sectionClasses = [
    styles.section,
    tone === 'subtle' ? styles.subtle : '',
    isVisible ? styles.visible : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <section
      id={id}
      className={sectionClasses}
      aria-labelledby={title ? headingId : undefined}
      aria-label={!title ? ariaLabel : undefined}
    >
      <Container size={narrow ? 'prose' : 'default'}>
        <div ref={ref} className={styles.reveal}>
          {(eyebrow || title || intro) && (
            <header className={styles.header}>
              {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
              {title && (
                <h2 id={headingId} className={styles.title}>
                  {title}
                </h2>
              )}
              {intro && <p className={styles.intro}>{intro}</p>}
            </header>
          )}
          {children}
        </div>
      </Container>
    </section>
  );
}
