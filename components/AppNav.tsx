'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { IconClose, IconMenu } from './Icons';
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

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const close = () => setOpen(false);

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
        <ThemeToggle />
        <LogoutButton />
        <button
          className="icon-btn menu-btn"
          type="button"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label="Открыть меню"
          title="Меню"
          onClick={() => setOpen(true)}
        >
          <IconMenu />
        </button>
      </div>

      <div
        className={`nav-backdrop ${open ? 'show' : ''}`}
        onPointerDown={close}
        aria-hidden={!open}
      />
      <nav
        id="mobile-nav"
        className={`mobile-drawer ${open ? 'show' : ''}`}
        aria-label="Мобильное меню"
        aria-hidden={!open}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <div className="mobile-drawer-head">
          <span className="eyebrow">Меню</span>
          <button
            className="icon-btn"
            type="button"
            aria-label="Закрыть меню"
            title="Закрыть"
            onClick={close}
          >
            <IconClose />
          </button>
        </div>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={isCurrentPath(currentPath, link.href) ? 'page' : undefined}
            onClick={close}
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
