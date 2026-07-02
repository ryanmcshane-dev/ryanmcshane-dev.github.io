import { Section } from '@/components/Section/Section';
import { FlowDiagram } from '@/components/FlowDiagram/FlowDiagram';
import { flagshipCaseStudy } from '@/content/caseStudies';
import styles from './CaseStudy.module.css';

export function CaseStudy() {
  const cs = flagshipCaseStudy;

  return (
    <Section id="case-study" eyebrow={cs.eyebrow} title={cs.title}>
      <p className={styles.summary}>{cs.summary}</p>

      <div className={styles.diagramWrap}>
        <FlowDiagram steps={cs.flow} />
      </div>

      <div className={styles.layout}>
        <div className={styles.narrative}>
          {cs.sections.map((section) => (
            <div key={section.heading} className={styles.block}>
              <h3 className={styles.blockHeading}>{section.heading}</h3>
              {section.body.map((paragraph, i) => (
                <p key={i} className={styles.blockBody}>
                  {paragraph}
                </p>
              ))}
            </div>
          ))}

          <p className={styles.framing}>{cs.framing}</p>
        </div>

        <div className={styles.outcomes}>
          <p className={styles.outcomesLabel}>Outcome</p>
          <dl className={styles.outcomeList}>
            {cs.outcomes.map((o) => (
              <div key={o.label} className={styles.outcome}>
                <dt className={styles.outcomeLabel}>{o.label}</dt>
                <dd className={styles.outcomeValue}>{o.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Section>
  );
}
