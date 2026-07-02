import { describe, it, expect } from 'vitest';
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
});
