import { Link } from 'react-router-dom';
import { SeoHead } from '@/components/SeoHead/SeoHead';
import { Section } from '@/components/Section/Section';
import styles from './NotFound.module.css';

export function NotFound() {
  return (
    <>
      <SeoHead title="Page not found" path="/404" />
      <Section id="not-found" ariaLabel="Page not found">
        <div className={styles.wrap}>
          <p className={styles.code}>404</p>
          <h1 className={styles.title}>This page took a wrong turn.</h1>
          <p className={styles.body}>
            The page you’re looking for doesn’t exist or has moved.
          </p>
          <Link to="/" className={styles.home}>
            ← Back to home
          </Link>
        </div>
      </Section>
    </>
  );
}
