import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.setAttribute('data-theme', 'light');
  });

  it('renders a labelled toggle button', () => {
    renderWithProviders(<ThemeToggle />);
    expect(screen.getByRole('button')).toHaveAccessibleName(/switch to (dark|light) mode/i);
  });

  it('updates its accessible name after toggling', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ThemeToggle />);
    const button = screen.getByRole('button');
    const before = button.getAttribute('aria-label');
    await user.click(button);
    expect(button.getAttribute('aria-label')).not.toBe(before);
  });
});
