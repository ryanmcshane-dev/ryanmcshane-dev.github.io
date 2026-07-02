import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Impact } from './Impact';
import { impact } from '@/content/impact';

describe('Impact', () => {
  it('renders one card per impact entry', () => {
    renderWithProviders(<Impact />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(impact.length);
  });

  it('renders each metric and title', () => {
    renderWithProviders(<Impact />);
    for (const card of impact) {
      expect(screen.getByText(card.metric)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: card.title })).toBeInTheDocument();
    }
  });
});
