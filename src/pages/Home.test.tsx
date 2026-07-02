import { describe, it, expect } from 'vitest';
import { axe } from 'jest-axe';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Home } from './Home';

describe('Home', () => {
  it('renders all primary sections', () => {
    const { container } = renderWithProviders(<Home />);
    for (const id of ['about', 'ai-native', 'case-study', 'work', 'skills', 'contact']) {
      expect(container.querySelector(`#${id}`)).toBeInTheDocument();
    }
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('has no detectable accessibility violations', async () => {
    const { container } = renderWithProviders(<Home />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
