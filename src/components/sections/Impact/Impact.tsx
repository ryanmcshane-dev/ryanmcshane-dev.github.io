import { Section } from '@/components/Section/Section';
import { impact } from '@/content/impact';
import styles from './Impact.module.css';

export function Impact() {
  return (
    <Section
      id="work"
      tone="subtle"
      eyebrow="Selected work & impact"
      title="Outcomes at scale"
      intro="A few results from leading the platforms behind near-real-time enterprise integrations."
    >
      <ul className={styles.grid}>
        {impact.map((card) => (
          <li key={card.id} className={styles.card}>
            <p className={styles.metric}>
              {card.metric}
              <span className={styles.unit}>{card.unit}</span>
            </p>
            <h3 className={styles.title}>{card.title}</h3>
            <p className={styles.description}>{card.description}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
