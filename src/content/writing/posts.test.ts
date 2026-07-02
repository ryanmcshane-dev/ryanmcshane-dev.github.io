import { describe, it, expect } from 'vitest';
import { posts, hasPosts, getPost } from './posts';

describe('writing posts loader', () => {
  it('excludes draft posts (the template is a draft)', () => {
    // Only the draft template exists today, so no posts should be published.
    expect(hasPosts).toBe(false);
    expect(posts).toHaveLength(0);
  });

  it('returns undefined for unknown slugs', () => {
    expect(getPost('does-not-exist')).toBeUndefined();
  });

  it('never surfaces a draft via getPost', () => {
    expect(getPost('example-post')).toBeUndefined();
  });
});
