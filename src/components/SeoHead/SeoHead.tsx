import { Helmet } from 'react-helmet-async';
import { siteConfig } from '@/config';

interface SeoHeadProps {
  /** Page-specific title; falls back to the site title. */
  title?: string;
  description?: string;
  /** Path (e.g. "/writing") used to build the canonical URL. */
  path?: string;
  /** og:type — "website" for pages, "article" for posts. */
  type?: 'website' | 'article';
}

export function SeoHead({
  title,
  description = siteConfig.description,
  path = '/',
  type = 'website',
}: SeoHeadProps) {
  const fullTitle = title ? `${title} — ${siteConfig.name}` : siteConfig.title;
  const canonical = `${siteConfig.siteUrl}${path === '/' ? '' : path}`;
  const ogImage = `${siteConfig.siteUrl}${siteConfig.ogImage}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={siteConfig.name} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
}
