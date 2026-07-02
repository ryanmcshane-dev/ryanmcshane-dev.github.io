export interface ImpactCard {
  id: string;
  /** Headline metric, e.g. "~11K". */
  metric: string;
  /** Unit / short qualifier under the metric, e.g. "events / day". */
  unit: string;
  title: string;
  description: string;
}

export const impact: ImpactCard[] = [
  {
    id: 'throughput',
    metric: '~11K',
    unit: 'events / day',
    title: 'Near-real-time event streaming',
    description:
      'Backend services stream roughly 11,000 events a day from enterprise systems of record to external HCM platforms across two event-driven API platforms.',
  },
  {
    id: 'scale',
    metric: '1,200+',
    unit: 'customers · 9 integrations',
    title: 'Integration platform at scale',
    description:
      'The platforms serve more than 1,200 customers across nine integrations — one solution became an industry benchmark and helped win a major HCM vendor as a customer.',
  },
  {
    id: 'reliability',
    metric: 'Days → hours',
    unit: 'detection to resolution',
    title: 'Upstream-lag detection',
    description:
      'I built an upstream-lag detector that flags when event delivery falls 30+ minutes behind the source system, cutting incident detection-to-resolution from days to hours.',
  },
  {
    id: 'delivery',
    metric: '~4 weeks',
    unit: 'from a 2+ month projection',
    title: 'Spec-driven delivery',
    description:
      'An AI-accelerated design spec for a first-of-its-kind EOI integration earned architect sign-off with minimal revisions and shipped in roughly four weeks.',
  },
];
