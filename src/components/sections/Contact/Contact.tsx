import { Section } from '@/components/Section/Section';
import { SocialLinks } from '@/components/SocialLinks/SocialLinks';
import { siteConfig } from '@/config';
import styles from './Contact.module.css';

export function Contact() {
  return (
    <Section id="contact" tone="subtle" eyebrow="Contact" title="Let’s talk">
      <div className={styles.card}>
        <p className={styles.lead}>
          I’m open to senior software and AI engineering roles at product-focused teams.
          The fastest way to reach me is email.
        </p>
        <a className={styles.emailButton} href={siteConfig.links.email}>
          {siteConfig.email}
        </a>
        <SocialLinks showLabels className={styles.social} />
      </div>
    </Section>
  );
}
