import { Link } from 'react-router-dom';
import { Section } from '@/components/Section/Section';
import { aiNative } from '@/content/aiNative';
import styles from './AiNative.module.css';

export function AiNative() {
  return (
    <Section
      id="ai-native"
      tone="subtle"
      eyebrow="AI-native engineering"
      title="Spec-driven development & agentic coding craft"
      intro={aiNative.intro}
    >
      <p className={styles.statement}>
        <span className={styles.quoteMark} aria-hidden="true">
          “
        </span>
        {aiNative.statement}
      </p>

      <div className={styles.pillars}>
        {aiNative.pillars.map((pillar) => (
          <article key={pillar.id} className={styles.pillar}>
            <header className={styles.pillarHeader}>
              <h3 className={styles.pillarTitle}>{pillar.title}</h3>
              <p className={styles.pillarTagline}>{pillar.tagline}</p>
            </header>
            {pillar.body.map((paragraph, i) => (
              <p key={i} className={styles.pillarBody}>
                {paragraph}
              </p>
            ))}
            <ul className={styles.points}>
              {pillar.points.map((point) => (
                <li key={point} className={styles.point}>
                  <span className={styles.check} aria-hidden="true">
                    ✓
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className={styles.toolkitRow}>
        <span className={styles.toolkitLabel}>Toolkit</span>
        <ul className={styles.toolkit}>
          {aiNative.toolkit.map((tool) => (
            <li key={tool} className={styles.chip}>
              {tool}
            </li>
          ))}
        </ul>
      </div>

      <p className={styles.dogfood}>
        This site is itself built with a spec-driven, agentic workflow —{' '}
        <Link to="/colophon">see how it was built</Link>.
      </p>
    </Section>
  );
}
