import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Section } from './Section';

describe('Section', () => {
  it('renders a titled, labelled region with an id', () => {
    render(
      <Section id="demo" eyebrow="Eyebrow" title="Demo title" intro="Intro text">
        <p>body</p>
      </Section>,
    );
    const heading = screen.getByRole('heading', { level: 2, name: 'Demo title' });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveAttribute('id', 'demo-title');
    expect(screen.getByText('Eyebrow')).toBeInTheDocument();
    expect(screen.getByText('Intro text')).toBeInTheDocument();
    expect(screen.getByText('body')).toBeInTheDocument();
  });

  it('uses aria-label when there is no visible title', () => {
    const { container } = render(
      <Section id="plain" ariaLabel="Plain section">
        <p>content</p>
      </Section>,
    );
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-label', 'Plain section');
    expect(section).toHaveAttribute('id', 'plain');
  });
});
