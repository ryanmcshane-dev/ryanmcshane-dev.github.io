import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Footer } from './Footer';

describe('Footer', () => {
  it('shows the name, the colophon link, and the current year', () => {
    renderWithProviders(<Footer />);
    expect(screen.getByText('Ryan McShane')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /how this site was built/i })).toHaveAttribute(
      'href',
      '/colophon',
    );
    expect(
      screen.getByText(new RegExp(String(new Date().getFullYear()))),
    ).toBeInTheDocument();
  });

  it('renders footer social links', () => {
    renderWithProviders(<Footer />);
    const nav = screen.getByRole('navigation', { name: 'Footer' });
    expect(nav).toBeInTheDocument();
  });
});
