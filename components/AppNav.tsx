'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { IconClose, IconMenu } from './Icons';
import { LogoutButton } from './LogoutButton';
import { ThemeToggle } from './ThemeProvider';
import { isCurrentPath } from '@/lib/nav';

interface NavLink {
  href: string;
  label: string;
}

interface AppNavProps {
  username: string;
  currentPath: string;
  links: NavLink[];
}

const barHrefs = new Set(['/', '/quiz', '/tutor']);

export function AppNav({ username, currentPath, links }: AppNavProps) {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const barLinks = links.filter((link) => barHrefs.has(link.href));
  const moreLinks = links.filter((link) => !barHrefs.has(link.href));
  const moreCurrent = moreLinks.find((link) => isCurrentPath(currentPath, link.href));

  useEffect(() => {
    setOpen(false);
    setMoreOpen(false);
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

  useEffect(() => {
    if (!moreOpen) return undefined;
    const onPointer = (event: PointerEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      window.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  const close = () => setOpen(false);

  return (
    <>
      <div className="toolbar desktop-toolbar">
        <nav className="nav-links" aria-label="Основное меню">
          {barLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isCurrentPath(currentPath, link.href) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ))}
          {moreLinks.length > 0 ? (
            <div className="nav-more" ref={moreRef}>
              <button
                className="nav-more-btn"
                type="button"
                aria-expanded={moreOpen}
                aria-controls="desktop-more"
                aria-current={moreCurrent ? 'page' : undefined}
                onClick={() => setMoreOpen((value) => !value)}
              >
                {moreCurrent?.label ?? 'Ещё'}
                <span className="nav-more-caret" aria-hidden="true" />
              </button>
              {moreOpen ? (
                <div className="nav-more-menu" id="desktop-more">
                  {moreLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={
                        isCurrentPath(currentPath, link.href) ? 'page' : undefined
                      }
                      onClick={() => setMoreOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </nav>
        <span className="eyebrow user-chip" title={username}>
          {username}
        </span>
        <ThemeToggle />
        <LogoutButton />
      </div>

      <div className="mobile-toolbar">
        <span className="eyebrow user-chip" title={username}>
          {username}
        </span>
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
