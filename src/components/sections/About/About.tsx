import { useState } from 'react';
import { Section } from '@/components/Section/Section';
import { about } from '@/content/about';
import styles from './About.module.css';

export function About() {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <Section id="about" eyebrow="About" title="Engineer, then lead — the same instincts at every level">
      <div className={styles.grid}>
        <div className={styles.body}>
          {about.paragraphs.map((p, i) => (
            <p key={i} className={styles.paragraph}>
              {p}
            </p>
          ))}

          <ol className={styles.arc} aria-label="Career progression">
            {about.arc.map((step, i) => (
              <li key={step.role} className={styles.arcStep}>
                <span className={styles.arcRole}>{step.role}</span>
                <span className={styles.arcNote}>{step.note}</span>
                {i < about.arc.length - 1 && (
                  <span className={styles.arcArrow} aria-hidden="true">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>

        <div className={styles.side}>
          <figure className={styles.figure}>
            <div className={styles.photoFrame}>
              {!imgFailed ? (
                <img
                  className={styles.photo}
                  src={about.headshot.src}
                  alt={about.headshot.alt}
                  width={480}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  onError={() => setImgFailed(true)}
                />
              ) : (
                <div className={styles.placeholder} role="img" aria-label={about.headshot.alt}>
                  <span className={styles.monogram} aria-hidden="true">
                    RM
                  </span>
                  <span className={styles.placeholderNote}>Photo coming soon</span>
                </div>
              )}
            </div>
          </figure>

          <dl className={styles.facts}>
            {about.facts.map((fact) => (
              <div key={fact.label} className={styles.fact}>
                <dt className={styles.factLabel}>{fact.label}</dt>
                <dd className={styles.factValue}>{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}
