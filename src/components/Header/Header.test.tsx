import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { Header, navItems } from './Header';

describe('Header', () => {
  it('renders the brand link home and the primary nav items', () => {
    renderWithProviders(<Header />);
    expect(screen.getByRole('link', { name: /ryan mcshane — home/i })).toHaveAttribute(
      'href',
      '/',
    );
    // In jsdom the desktop nav resolves to display:none (mobile-first, no viewport
    // width) and the mobile nav is `hidden`, so include hidden elements and assert
    // each nav href is present among the rendered links.
    const hrefs = screen
      .getAllByRole('link', { hidden: true })
      .map((l) => l.getAttribute('href'));
    for (const item of navItems) {
      expect(hrefs).toContain(item.href);
    }
    expect(screen.getAllByRole('navigation', { hidden: true }).length).toBeGreaterThan(0);
  });

  it('does not link to Writing until posts exist', () => {
    renderWithProviders(<Header />);
    expect(navItems.find((i) => /writing/i.test(i.label))).toBeUndefined();
  });

  it('toggles the mobile menu open and closed', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Header />);
    const button = screen.getByRole('button', { name: /toggle navigation menu/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});
