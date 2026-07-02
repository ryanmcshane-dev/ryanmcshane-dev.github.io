import type { ReactNode } from 'react';
import { Header } from '@/components/Header/Header';
import { Footer } from '@/components/Footer/Footer';
import styles from './Layout.module.css';

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <a href="#main" className={styles.skipLink}>
        Skip to content
      </a>
      <Header />
      <main id="main" className={styles.main} tabIndex={-1}>
        {children}
      </main>
      <Footer />
    </div>
  );
}
