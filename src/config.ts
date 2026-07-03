/**
 * Central site configuration. Single source of truth for identity, URLs, and
 * contact links so SEO metadata and UI stay in sync. To move to a custom domain,
 * change `siteUrl` here and add `public/CNAME`.
 */
export const siteConfig = {
  name: 'Ryan McShane',
  title: 'Ryan McShane — Senior Software Engineer & Tech Lead',
  role: 'Senior Software Engineer & Tech Lead',
  tagline:
    'I lead teams building event-driven backend platforms — and I build the spec-driven, agentic workflows that make modern engineering faster.',
  description:
    'Ryan McShane — Senior Software Engineer & Tech Lead specializing in AI-native engineering: spec-driven development and agentic coding.',
  siteUrl: 'https://ryanmcshane-dev.github.io',
  ogImage: '/og-image.png',
  email: 'ryanmcshane429@gmail.com',
  links: {
    email: 'mailto:ryanmcshane429@gmail.com',
    linkedin: 'https://www.linkedin.com/in/ryan-mcshane-4207a5131',
    github: 'https://github.com/ryanmcshane-dev',
  },
} as const;

export type SiteConfig = typeof siteConfig;
