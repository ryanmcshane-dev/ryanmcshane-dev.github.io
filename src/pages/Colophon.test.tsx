import { describe, it, expect } from 'vitest';
import { axe } from 'jest-axe';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Colophon } from './Colophon';
import { colophon } from '@/content/colophon';

describe('Colophon page', () => {
  it('renders the "how this site was built" heading', () => {
    renderWithProviders(<Colophon />, { route: '/colophon' });
    expect(
      screen.getByRole('heading', { level: 2, name: /how this site was built/i }),
    ).toBeInTheDocument();
  });

  it('renders each process step', () => {
    renderWithProviders(<Colophon />, { route: '/colophon' });
    for (const step of colophon.steps) {
      expect(screen.getByRole('heading', { name: step.title })).toBeInTheDocument();
    }
  });

  it('links to the GitHub source', () => {
    renderWithProviders(<Colophon />, { route: '/colophon' });
    expect(screen.getByRole('link', { name: /view the source on github/i })).toBeInTheDocument();
  });

  it('spotlights the Job Radar pipeline and links to its page', () => {
    renderWithProviders(<Colophon />, { route: '/colophon' });
    expect(
      screen.getByRole('heading', { name: colophon.spotlight.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: new RegExp(colophon.spotlight.linkText, 'i') }),
    ).toHaveAttribute('href', '/job-radar');
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderWithProviders(<Colophon />, { route: '/colophon' });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
