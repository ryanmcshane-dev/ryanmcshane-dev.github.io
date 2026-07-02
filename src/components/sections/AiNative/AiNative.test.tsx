import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { AiNative } from './AiNative';
import { aiNative } from '@/content/aiNative';

describe('AiNative', () => {
  it('renders both pillar titles', () => {
    renderWithProviders(<AiNative />);
    for (const pillar of aiNative.pillars) {
      expect(screen.getByRole('heading', { name: pillar.title })).toBeInTheDocument();
    }
  });

  it('renders the builder-not-consumer statement', () => {
    renderWithProviders(<AiNative />);
    expect(screen.getByText(new RegExp('builder of agentic workflows', 'i'))).toBeInTheDocument();
  });

  it('links to the colophon to prove the method', () => {
    renderWithProviders(<AiNative />);
    expect(screen.getByRole('link', { name: /how it was built/i })).toHaveAttribute(
      'href',
      '/colophon',
    );
  });
});
