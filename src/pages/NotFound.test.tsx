import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { NotFound } from './NotFound';

describe('NotFound page', () => {
  it('renders a 404 message and a link home', () => {
    renderWithProviders(<NotFound />, { route: '/nope' });
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to home/i })).toHaveAttribute('href', '/');
  });
});
