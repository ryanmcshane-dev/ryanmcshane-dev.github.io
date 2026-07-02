export interface AboutContent {
  /** Lead paragraphs for the About section. */
  paragraphs: string[];
  /** Compact career arc for a mono/timeline treatment. */
  arc: { role: string; note: string }[];
  /** At-a-glance facts about the current role. */
  facts: { label: string; value: string }[];
  headshot: {
    src: string;
    alt: string;
  };
}

export const about: AboutContent = {
  paragraphs: [
    'I’m a Senior Software Engineer and Tech Lead with 7+ years at Lincoln Financial Group, where I grew from quality engineering into building software and then leading it. I care about the same things at every level: clear design, reliable systems, and teams that ship with confidence.',
    'Today I lead a nine-engineer team that owns the backend services behind two near-real-time, event-driven API platforms and an internal React admin UI. Those platforms stream roughly 11,000 events a day from enterprise systems of record to external HCM platforms, serving 1,200+ customers across nine integrations.',
    'Lately my focus has been AI-native engineering — using spec-driven development and agentic coding to compress design and delivery from weeks to days, and helping my team adopt the same practices.',
  ],
  arc: [
    { role: 'QE Engineer', note: 'Quality engineering foundations' },
    { role: 'Software Engineer', note: 'Building the platforms' },
    { role: 'Tech Lead', note: 'Leading a 9-engineer team' },
  ],
  facts: [
    { label: 'Team', value: '9 engineers' },
    { label: 'Platforms', value: '2 event-driven APIs + admin UI' },
    { label: 'Throughput', value: '~11K events/day' },
    { label: 'Scale', value: '1,200+ customers · 9 integrations' },
  ],
  headshot: {
    // Drop the portrait at public/images/ryan.jpg to replace the placeholder.
    src: '/images/ryan.jpg',
    alt: 'Portrait of Ryan McShane',
  },
};
