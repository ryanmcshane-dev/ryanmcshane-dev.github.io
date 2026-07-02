import type { FlowStep } from '@/content/caseStudies';
import styles from './FlowDiagram.module.css';

interface FlowDiagramProps {
  steps: FlowStep[];
}

const actorLabel: Record<FlowStep['actor'], string> = {
  partner: 'HCM platform',
  ours: 'Our services',
  user: 'Employee',
};

/**
 * Ordered, accessible flow of the EOI integration. Rendered as an ordered list
 * (semantics + keyboard/screen-reader friendly) styled to read as a diagram, with
 * color-coded actor lanes and connectors between steps.
 */
export function FlowDiagram({ steps }: FlowDiagramProps) {
  return (
    <figure className={styles.figure}>
      <ol className={styles.flow}>
        {steps.map((step, i) => (
          <li key={step.id} className={styles.step} data-actor={step.actor}>
            <div className={styles.node}>
              <div className={styles.nodeTop}>
                <span className={styles.index} aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className={styles.actor} data-actor={step.actor}>
                  {actorLabel[step.actor]}
                </span>
              </div>
              <p className={styles.label}>{step.label}</p>
              <p className={styles.detail}>{step.detail}</p>
            </div>
            {i < steps.length - 1 && (
              <span className={styles.connector} aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" focusable="false">
                  <path
                    d="M4 12h14m0 0-5-5m5 5-5 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
          </li>
        ))}
      </ol>
      <figcaption className={styles.caption}>
        End-to-end EOI flow: enrollment notification → prepopulated resource → SSO →
        outbound decision, keyed to the original notification id.
      </figcaption>
    </figure>
  );
}
