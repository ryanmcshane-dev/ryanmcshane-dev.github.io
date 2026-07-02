import type { ElementType, ReactNode } from 'react';
import styles from './Container.module.css';

interface ContainerProps {
  children: ReactNode;
  as?: ElementType;
  /** Narrow width for long-form reading. */
  size?: 'default' | 'prose';
  className?: string;
}

export function Container({
  children,
  as: Tag = 'div',
  size = 'default',
  className,
}: ContainerProps) {
  const classes = [styles.container, size === 'prose' ? styles.prose : '', className]
    .filter(Boolean)
    .join(' ');
  return <Tag className={classes}>{children}</Tag>;
}
