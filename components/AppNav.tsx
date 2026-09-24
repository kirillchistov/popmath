'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LogoutButton } from './LogoutButton';
import { ThemeToggle } from './ThemeProvider';
import { isCurrentPath } from '@/lib/nav';

interface AppNavProps {
  username: string;
  currentPath: string;
  links: { href: string; label: string }[];
}

export function AppNav({ username, currentPath, links }: AppNavProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [currentPath]);

  useEffect(() => {
    document.body.classList.toggle('nav-open', open);
    return () => document.body.classList.remove('nav-open');
  }, [open]);

  return (
    <>
      <div className="toolbar desktop-toolbar">
        <nav className="nav-links" aria-label="Основное меню">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrentPath(currentPath, link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <span className="eyebrow user-chip">{username}</span>
        <ThemeToggle />
        <LogoutButton />
      </div>

      <div className="mobile-toolbar">
        <span className="eyebrow user-chip">{username}</span>
        <button
          className="menu-btn"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          {open ? 'Закрыть' : 'Меню'}
        </button>
      </div>

      <div
        className={`nav-backdrop ${open ? 'show' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />
      <nav
        id="mobile-nav"
        className={`mobile-drawer ${open ? 'show' : ''}`}
        aria-label="Мобильное меню"
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isCurrentPath(currentPath, link.href) ? 'page' : undefined}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        <div className="mobile-drawer-actions">
          <ThemeToggle />
          <LogoutButton />
        </div>
      </nav>
    </>
  );
}
