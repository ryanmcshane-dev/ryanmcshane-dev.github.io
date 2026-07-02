import { Link, useParams } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { SeoHead } from '@/components/SeoHead/SeoHead';
import { Section } from '@/components/Section/Section';
import { getPost } from '@/content/writing/posts';
import { NotFound } from '@/pages/NotFound';
import styles from './WritingPost.module.css';

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function WritingPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? getPost(slug) : undefined;

  if (!post) {
    return <NotFound />;
  }

  const { Component } = post;

  return (
    <>
      <SeoHead
        title={post.title}
        description={post.description}
        path={`/writing/${post.slug}`}
        type="article"
      />
      <Section id="post" narrow>
        <p className={styles.back}>
          <Link to="/writing">← All writing</Link>
        </p>
        <header className={styles.header}>
          <time className={styles.date} dateTime={post.date}>
            {formatDate(post.date)}
          </time>
          <h1 className={styles.title}>{post.title}</h1>
        </header>
        <article className={styles.prose}>
          <MDXProvider>
            <Component />
          </MDXProvider>
        </article>
      </Section>
    </>
  );
}
