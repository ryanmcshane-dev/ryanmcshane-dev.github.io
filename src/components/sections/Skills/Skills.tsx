import { Section } from '@/components/Section/Section';
import { skillGroups } from '@/content/skills';
import styles from './Skills.module.css';

export function Skills() {
  return (
    <Section id="skills" eyebrow="Skills" title="Tools of the trade">
      <div className={styles.grid}>
        {skillGroups.map((group) => (
          <section key={group.id} className={styles.group} aria-label={group.title}>
            <h3 className={styles.groupTitle}>{group.title}</h3>
            <ul className={styles.skillList}>
              {group.skills.map((skill) => (
                <li key={skill} className={styles.skill}>
                  {skill}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Section>
  );
}
