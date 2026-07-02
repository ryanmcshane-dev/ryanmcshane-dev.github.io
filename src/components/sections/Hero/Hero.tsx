import { Link } from 'react-router-dom';
import { Container } from '@/components/Container/Container';
import { SocialLinks } from '@/components/SocialLinks/SocialLinks';
import { siteConfig } from '@/config';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero} aria-label="Introduction">
      <Container className={styles.inner}>
        <div className={styles.content}>
          <p className={styles.eyebrow}>
            <span className={styles.dot} aria-hidden="true" />
            Available for senior software &amp; AI engineering roles
          </p>
          <h1 className={styles.name}>{siteConfig.name}</h1>
          <p className={styles.role}>{siteConfig.role}</p>
          <p className={styles.tagline}>{siteConfig.tagline}</p>

          <div className={styles.actions}>
            <Link className={styles.primary} to="/#case-study">
              See the flagship case study
            </Link>
            <SocialLinks />
          </div>
        </div>

        <div className={styles.aside} aria-hidden="true">
          <div className={styles.terminal}>
            <div className={styles.terminalBar}>
              <span className={styles.trafficLight} />
              <span className={styles.trafficLight} />
              <span className={styles.trafficLight} />
              <span className={styles.terminalTitle}>spec — portfolio-site</span>
            </div>
            <pre className={styles.terminalBody}>
              <code>
                <span className={styles.line}>
                  <span className={styles.prompt}>$</span> claude “build my portfolio,
                  spec-first”
                </span>
                <span className={styles.line}>
                  <span className={styles.comment}># spec.md → decomposed task list</span>
                </span>
                <span className={styles.line}>
                  <span className={styles.done}>✓</span> 1.0 design system + tokens
                </span>
                <span className={styles.line}>
                  <span className={styles.done}>✓</span> 2.0 layout shell + routing
                </span>
                <span className={styles.line}>
                  <span className={styles.done}>✓</span> 3.0 AI-native centerpiece
                </span>
                <span className={styles.line}>
                  <span className={styles.active}>▸</span> 4.0 flagship case study
                  <span className={styles.caret} />
                </span>
              </code>
            </pre>
          </div>
        </div>
      </Container>
    </section>
  );
}
