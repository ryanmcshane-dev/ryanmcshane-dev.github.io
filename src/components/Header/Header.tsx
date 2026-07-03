import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container } from '@/components/Container/Container';
import { ThemeToggle } from '@/components/ThemeToggle/ThemeToggle';
import { siteConfig } from '@/config';
import styles from './Header.module.css';

export interface NavItem {
  label: string;
  href: string;
}

// Section anchors live on the home route; use root-relative hashes so links work
// from any page (router navigates home, then ScrollManager scrolls to the anchor).
export const navItems: NavItem[] = [
  { label: 'About', href: '/#about' },
  { label: 'AI-Native', href: '/#ai-native' },
  { label: 'Case Study', href: '/#case-study' },
  { label: 'Work', href: '/#work' },
  { label: 'Skills', href: '/#skills' },
  { label: 'Job Radar', href: '/job-radar' },
  { label: 'Contact', href: '/#contact' },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname, hash } = useLocation();

  // Close the mobile menu whenever the route or hash changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname, hash]);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <Link to="/" className={styles.brand} aria-label={`${siteConfig.name} — home`}>
          <span className={styles.brandMark} aria-hidden="true">
            &gt;_
          </span>
          <span className={styles.brandName}>{siteConfig.name}</span>
        </Link>

        <nav className={styles.desktopNav} aria-label="Primary">
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link to={item.href} className={styles.navLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.actions}>
          <ThemeToggle />
          <button
            type="button"
            className={styles.menuButton}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label="Toggle navigation menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span className={styles.menuIcon} data-open={menuOpen} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      </Container>

      <nav
        id="mobile-menu"
        className={styles.mobileNav}
        data-open={menuOpen}
        aria-label="Primary mobile"
        hidden={!menuOpen}
      >
        <Container>
          <ul className={styles.mobileList}>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link to={item.href} className={styles.mobileLink}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </nav>
    </header>
  );
}
