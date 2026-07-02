import { Link } from 'react-router-dom';
import { Container } from '@/components/Container/Container';
import { siteConfig } from '@/config';
import styles from './Footer.module.css';

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <Container className={styles.inner}>
        <div className={styles.left}>
          <p className={styles.name}>{siteConfig.name}</p>
          <p className={styles.meta}>
            Built spec-driven &amp; agentically.{' '}
            <Link to="/colophon" className={styles.metaLink}>
              How this site was built
            </Link>
          </p>
        </div>
        <nav className={styles.links} aria-label="Footer">
          <a href={siteConfig.links.email}>Email</a>
          <a href={siteConfig.links.linkedin} target="_blank" rel="noreferrer noopener">
            LinkedIn
          </a>
          <a href={siteConfig.links.github} target="_blank" rel="noreferrer noopener">
            GitHub
          </a>
        </nav>
        <p className={styles.copy}>© {year} {siteConfig.name}</p>
      </Container>
    </footer>
  );
}
