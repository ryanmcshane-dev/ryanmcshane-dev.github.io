import { describe, it, expect } from 'vitest';
import { axe } from 'jest-axe';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { JobRadar, JobRadarView } from './JobRadar';
import type { RadarItem, RadarReportView } from '@/content/jobRadar';

function makeItem(overrides: Partial<RadarItem> = {}): RadarItem {
  return {
    id: overrides.id ?? 'x1',
    source: 'ashby',
    company: overrides.company ?? 'OpenAI',
    title: overrides.title ?? 'Member of Technical Staff',
    location: overrides.location ?? 'San Francisco, CA',
    remote: overrides.remote ?? true,
    url: overrides.url ?? 'https://jobs.example.com/1',
    descriptionText: overrides.descriptionText ?? 'Build agentic systems.',
    compHint: overrides.compHint,
    score: overrides.score ?? {
      fit: 90,
      verdict: 'strong',
      rationale: 'Strong senior AI-native match.',
      matched: ['Genuine AI-native engineering'],
      concerns: [],
    },
  };
}

function makeReport(items: RadarItem[], overrides: Partial<RadarReportView> = {}): RadarReportView {
  return {
    generatedAt: '2026-07-02T12:00:00.000Z',
    tier: overrides.tier ?? 'tier-1',
    counts: overrides.counts ?? {
      fetched: 1568,
      kept: 548,
      dropped: 1020,
      byVerdict: { strong: 1, possible: 1, weak: 0, skip: 0 },
      droppedByReason: {},
    },
    errors: [],
    items,
  };
}

describe('JobRadarView', () => {
  const report = makeReport([
    makeItem({ id: 'a', company: 'OpenAI', title: 'Member of Technical Staff' }),
    makeItem({
      id: 'b',
      company: 'Stripe',
      title: 'Staff Backend Engineer',
      compHint: '$220,000 – $260,000',
      score: {
        fit: 60,
        verdict: 'possible',
        rationale: 'Senior backend match; no clear AI-native signal.',
        matched: ['Backend / distributed / event-driven match'],
        concerns: ['no AI-native engineering signal', 'hybrid (partial remote)'],
      },
    }),
  ]);

  it('renders the page heading and run summary', () => {
    renderWithProviders(<JobRadarView report={report} />, { route: '/job-radar' });
    expect(
      screen.getByRole('heading', { level: 2, name: /agentic pipeline for my own job search/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('July 2, 2026')).toBeInTheDocument();
    expect(screen.getByText('1,568')).toBeInTheDocument();
  });

  it('groups roles by verdict and omits empty groups', () => {
    renderWithProviders(<JobRadarView report={report} />, { route: '/job-radar' });
    expect(screen.getByRole('heading', { level: 3, name: /strong fit/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /possible fit/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: /weak fit/i })).not.toBeInTheDocument();
  });

  it('renders a card per role with fit, rationale, tags, and an external apply link', () => {
    renderWithProviders(<JobRadarView report={report} />, { route: '/job-radar' });

    expect(screen.getByRole('heading', { level: 4, name: 'Member of Technical Staff' })).toBeInTheDocument();
    expect(screen.getByText(/no ai-native engineering signal/i)).toBeInTheDocument();
    expect(screen.getByText('$220,000 – $260,000')).toBeInTheDocument();
    expect(screen.getByLabelText('Fit score 90 out of 100')).toHaveTextContent('90');

    const links = screen.getAllByRole('link', { name: /view role/i });
    expect(links[0]).toHaveAttribute('href', 'https://jobs.example.com/1');
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('shows the Tier-1 caveat only for tier-1 data', () => {
    const { rerender } = renderWithProviders(<JobRadarView report={report} />, { route: '/job-radar' });
    expect(screen.getByText(/radar-score/)).toBeInTheDocument();
    rerender(<JobRadarView report={makeReport(report.items, { tier: 'tier-2' })} />);
    expect(screen.queryByText(/radar-score/)).not.toBeInTheDocument();
  });

  it('shows an empty state when nothing cleared the filters', () => {
    renderWithProviders(<JobRadarView report={makeReport([])} />, { route: '/job-radar' });
    expect(screen.getByText(/no roles cleared the filters/i)).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderWithProviders(<JobRadarView report={report} />, { route: '/job-radar' });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe('JobRadar (route container)', () => {
  it('renders cards from the committed snapshot', () => {
    renderWithProviders(<JobRadar />, { route: '/job-radar' });
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    // The committed data drives real role cards, each with an external apply link.
    expect(screen.getAllByRole('link', { name: /view role/i }).length).toBeGreaterThan(0);
  });
});
