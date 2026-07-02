import { describe, it, expect } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { SeoHead } from './SeoHead';
import { siteConfig } from '@/config';

describe('SeoHead', () => {
  it('sets a page-specific document title', async () => {
    renderWithProviders(<SeoHead title="Writing" path="/writing" />);
    await waitFor(() => {
      expect(document.title).toBe(`Writing — ${siteConfig.name}`);
    });
  });

  it('falls back to the full site title when no title is given', async () => {
    renderWithProviders(<SeoHead />);
    await waitFor(() => {
      expect(document.title).toBe(siteConfig.title);
    });
  });

  it('writes a canonical link and og:image meta', async () => {
    renderWithProviders(<SeoHead path="/colophon" />);
    await waitFor(() => {
      const canonical = document.querySelector('link[rel="canonical"]');
      expect(canonical).toHaveAttribute('href', `${siteConfig.siteUrl}/colophon`);
    });
    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage).toHaveAttribute('content', `${siteConfig.siteUrl}${siteConfig.ogImage}`);
  });
});
