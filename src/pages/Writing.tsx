import { Link } from 'react-router-dom';
import { SeoHead } from '@/components/SeoHead/SeoHead';
import { Section } from '@/components/Section/Section';
import { posts } from '@/content/writing/posts';
import styles from './Writing.module.css';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function Writing() {
  return (
    <>
      <SeoHead
        title="Writing"
        description="Notes on spec-driven development, agentic coding, and building reliable systems."
        path="/writing"
      />
      <Section
        id="writing"
        eyebrow="Writing"
        title="Notes on spec-driven & agentic engineering"
        intro="Occasional posts on designing for agents, spec-driven delivery, and reliable systems."
      >
        {posts.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>Posts are on the way.</p>
            <p className={styles.emptyBody}>
              I’m drafting writing on spec-driven development and agentic coding craft. In
              the meantime, the{' '}
              <Link to="/#ai-native">AI-native engineering</Link> section covers how I work.
            </p>
          </div>
        ) : (
          <ul className={styles.list}>
            {posts.map((post) => (
              <li key={post.slug} className={styles.item}>
                <Link to={`/writing/${post.slug}`} className={styles.link}>
                  <time className={styles.date} dateTime={post.date}>
                    {formatDate(post.date)}
                  </time>
                  <h2 className={styles.postTitle}>{post.title}</h2>
                  <p className={styles.postDesc}>{post.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
