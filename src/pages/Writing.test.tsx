import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Writing } from './Writing';

describe('Writing page', () => {
  it('shows the empty state while there are no published posts', () => {
    renderWithProviders(<Writing />, { route: '/writing' });
    expect(screen.getByText(/posts are on the way/i)).toBeInTheDocument();
  });

  it('links back to the AI-native section from the empty state', () => {
    renderWithProviders(<Writing />, { route: '/writing' });
    expect(screen.getByRole('link', { name: /ai-native engineering/i })).toHaveAttribute(
      'href',
      '/#ai-native',
    );
  });
});
