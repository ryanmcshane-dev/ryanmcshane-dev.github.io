import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Hero } from './Hero';
import { siteConfig } from '@/config';

describe('Hero', () => {
  it('renders the name as the page h1 and the role', () => {
    renderWithProviders(<Hero />);
    expect(screen.getByRole('heading', { level: 1, name: siteConfig.name })).toBeInTheDocument();
    expect(screen.getByText(siteConfig.role)).toBeInTheDocument();
  });

  it('links to the flagship case study', () => {
    renderWithProviders(<Hero />);
    expect(
      screen.getByRole('link', { name: /flagship case study/i }),
    ).toHaveAttribute('href', '/#case-study');
  });

  it('exposes primary social links', () => {
    renderWithProviders(<Hero />);
    expect(screen.getByRole('link', { name: /github/i })).toBeInTheDocument();
  });
});
