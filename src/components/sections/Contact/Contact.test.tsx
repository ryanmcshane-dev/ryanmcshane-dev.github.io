import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Contact } from './Contact';
import { siteConfig } from '@/config';

describe('Contact', () => {
  it('renders a prominent email link', () => {
    renderWithProviders(<Contact />);
    const emailLink = screen.getByRole('link', { name: siteConfig.email });
    expect(emailLink).toHaveAttribute('href', siteConfig.links.email);
  });

  it('renders labelled social links', () => {
    renderWithProviders(<Contact />);
    expect(screen.getByText('LinkedIn')).toBeInTheDocument();
    expect(screen.getByText('GitHub')).toBeInTheDocument();
  });
});
