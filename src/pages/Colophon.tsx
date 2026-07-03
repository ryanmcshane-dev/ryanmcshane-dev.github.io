import { Link } from 'react-router-dom';
import { SeoHead } from '@/components/SeoHead/SeoHead';
import { Section } from '@/components/Section/Section';
import { colophon } from '@/content/colophon';
import { siteConfig } from '@/config';
import styles from './Colophon.module.css';

export function Colophon() {
  return (
    <>
      <SeoHead
        title="How this site was built"
        description="A short case study: this portfolio was built spec-driven and agentically, task-by-task."
        path="/colophon"
      />
      <Section
        id="colophon"
        eyebrow="Colophon"
        title="How this site was built"
        intro="Built with the same spec-driven, agentic workflow it describes."
      >
        <div className={styles.intro}>
          {colophon.intro.map((p, i) => (
            <p key={i} className={styles.introP}>
              {p}
            </p>
          ))}
        </div>

        <ol className={styles.steps}>
          {colophon.steps.map((step) => (
            <li key={step.phase} className={styles.step}>
              <span className={styles.phase} aria-hidden="true">
                {step.phase}
              </span>
              <div>
                <h2 className={styles.stepTitle}>{step.title}</h2>
                <p className={styles.stepBody}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className={styles.spotlight} aria-labelledby="colophon-spotlight-title">
          <p className={styles.spotlightEyebrow}>{colophon.spotlight.eyebrow}</p>
          <h2 id="colophon-spotlight-title" className={styles.spotlightTitle}>
            {colophon.spotlight.title}
          </h2>
          {colophon.spotlight.body.map((p, i) => (
            <p key={i} className={styles.spotlightBody}>
              {p}
            </p>
          ))}
          <Link to={colophon.spotlight.href} className={styles.spotlightLink}>
            {colophon.spotlight.linkText}
            <span aria-hidden="true"> →</span>
          </Link>
        </section>

        <div className={styles.stack}>
          <h2 className={styles.stackHeading}>Under the hood</h2>
          <div className={styles.stackGrid}>
            {colophon.stack.map((group) => (
              <div key={group.group} className={styles.stackGroup}>
                <p className={styles.stackLabel}>{group.group}</p>
                <ul className={styles.stackList}>
                  {group.items.map((item) => (
                    <li key={item} className={styles.stackItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <p className={styles.closing}>{colophon.closing}</p>

        <p className={styles.links}>
          <a href={siteConfig.links.github} target="_blank" rel="noreferrer noopener">
            View the source on GitHub
          </a>{' '}
          · <Link to="/#ai-native">More on how I work</Link>
        </p>
      </Section>
    </>
  );
}
