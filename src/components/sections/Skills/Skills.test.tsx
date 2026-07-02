import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Skills } from './Skills';
import { skillGroups } from '@/content/skills';

describe('Skills', () => {
  it('renders each skill group as a labelled region', () => {
    renderWithProviders(<Skills />);
    for (const group of skillGroups) {
      expect(screen.getByRole('heading', { name: group.title })).toBeInTheDocument();
    }
  });

  it('renders individual skills including Claude Code', () => {
    renderWithProviders(<Skills />);
    expect(screen.getByText('Claude Code')).toBeInTheDocument();
    expect(screen.getByText('Spring Boot')).toBeInTheDocument();
  });
});
