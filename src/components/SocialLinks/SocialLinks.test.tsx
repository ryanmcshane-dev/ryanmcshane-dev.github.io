import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SocialLinks } from './SocialLinks';
import { siteConfig } from '@/config';

describe('SocialLinks', () => {
  it('renders email, LinkedIn, and GitHub links with correct hrefs', () => {
    render(<SocialLinks />);
    expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute(
      'href',
      siteConfig.links.email,
    );
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href',
      siteConfig.links.linkedin,
    );
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      siteConfig.links.github,
    );
  });

  it('opens external links safely in a new tab', () => {
    render(<SocialLinks />);
    const linkedin = screen.getByRole('link', { name: /linkedin/i });
    expect(linkedin).toHaveAttribute('target', '_blank');
    expect(linkedin).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('shows text labels when requested', () => {
    render(<SocialLinks showLabels />);
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
  });
});
