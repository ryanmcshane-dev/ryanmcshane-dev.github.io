import type { ComponentType } from 'react';

export interface PostMeta {
  title: string;
  description: string;
  /** ISO date, e.g. "2026-01-15". */
  date: string;
  slug: string;
  draft?: boolean;
  tags?: string[];
}

export interface Post extends PostMeta {
  Component: ComponentType;
}

interface MdxModule {
  default: ComponentType;
  meta: PostMeta;
}

/**
 * Blog posts are MDX files in this folder that export a `meta` object and default
 * content, e.g.:
 *
 *   export const meta = { title, description, date, slug };
 *   # Post body...
 *
 * Drop a new .mdx file here and it appears automatically — no registry to update.
 * The nav link to /writing stays hidden until at least one non-draft post exists.
 */
const modules = import.meta.glob<MdxModule>('./*.mdx', { eager: true });

export const posts: Post[] = Object.values(modules)
  .filter((mod) => mod.meta && !mod.meta.draft)
  .map((mod) => ({ ...mod.meta, Component: mod.default }))
  .sort((a, b) => (a.date < b.date ? 1 : -1));

export const hasPosts = posts.length > 0;

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug);
}
