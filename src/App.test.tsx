import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { App } from './App';

describe('App routing', () => {
  it('renders the home page at /', async () => {
    renderWithProviders(<App />, { route: '/' });
    expect(await screen.findByRole('heading', { level: 1, name: 'Ryan McShane' })).toBeInTheDocument();
  });

  it('renders the writing page at /writing', async () => {
    renderWithProviders(<App />, { route: '/writing' });
    expect(await screen.findByText(/posts are on the way/i)).toBeInTheDocument();
  });

  it('renders the colophon page at /colophon', async () => {
    renderWithProviders(<App />, { route: '/colophon' });
    expect(
      await screen.findByRole('heading', { level: 2, name: /how this site was built/i }),
    ).toBeInTheDocument();
  });

  it('renders the job radar page with role cards at /job-radar', async () => {
    renderWithProviders(<App />, { route: '/job-radar' });
    expect(
      await screen.findByRole('heading', { level: 2, name: /agentic pipeline for my own job search/i }),
    ).toBeInTheDocument();
    // The committed snapshot must drive visible role cards (guards the blank-page regression).
    expect((await screen.findAllByRole('link', { name: /view role/i })).length).toBeGreaterThan(0);
  });

  it('renders 404 for an unknown route', async () => {
    renderWithProviders(<App />, { route: '/nope' });
    expect(await screen.findByText('404')).toBeInTheDocument();
  });

  it('renders 404 for an unknown writing post slug', async () => {
    renderWithProviders(<App />, { route: '/writing/does-not-exist' });
    expect(await screen.findByText('404')).toBeInTheDocument();
  });

  it('always renders the layout landmarks', async () => {
    renderWithProviders(<App />, { route: '/' });
    // main and contentinfo (footer) are unique; assert those directly.
    expect(await screen.findByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    // A skip link targets the main region for keyboard users.
    expect(screen.getByRole('link', { name: /skip to content/i })).toHaveAttribute(
      'href',
      '#main',
    );
  });
});
