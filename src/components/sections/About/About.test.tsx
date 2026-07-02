import { describe, it, expect } from 'vitest';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { About } from './About';
import { about } from '@/content/about';

describe('About', () => {
  it('renders the about heading and first paragraph', () => {
    renderWithProviders(<About />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getByText(about.paragraphs[0])).toBeInTheDocument();
  });

  it('renders the headshot with alt text initially', () => {
    renderWithProviders(<About />);
    const img = screen.getByAltText(about.headshot.alt);
    expect(img).toHaveAttribute('src', about.headshot.src);
    expect(img).toHaveAttribute('loading', 'lazy');
  });

  it('falls back to a labelled placeholder when the photo fails to load', () => {
    renderWithProviders(<About />);
    const img = screen.getByAltText(about.headshot.alt);
    fireEvent.error(img);
    // After error, the <img> is replaced by a role="img" placeholder with the same label.
    const placeholder = screen.getByRole('img', { name: about.headshot.alt });
    expect(placeholder).toBeInTheDocument();
    expect(screen.getByText(/photo coming soon/i)).toBeInTheDocument();
  });

  it('lists the current-role facts', () => {
    renderWithProviders(<About />);
    for (const fact of about.facts) {
      expect(screen.getByText(fact.value)).toBeInTheDocument();
    }
  });
});
