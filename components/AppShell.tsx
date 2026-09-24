import Link from 'next/link';
import { ThemeToggle } from './ThemeProvider';
import { LogoutButton } from './LogoutButton';
import type { SessionPayload } from '@/lib/types';

const studentLinks = [
  { href: '/', label: 'Сегодня' },
  { href: '/quiz', label: 'Квиз' },
  { href: '/task', label: 'Темы' },
  { href: '/review', label: 'Разбор' },
  { href: '/map', label: 'Карта' },
];

function isCurrent(currentPath: string, href: string) {
  if (href === '/') return currentPath === '/';
  if (href === '/task') {
    return currentPath === '/task' || currentPath.startsWith('/topic/');
  }
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

interface AppShellProps {
  session: SessionPayload;
  currentPath: string;
  children: React.ReactNode;
}

export function AppShell({ session, currentPath, children }: AppShellProps) {
  const links =
    session.role === 'tutor'
      ? [...studentLinks, { href: '/tutor', label: 'Тьютор' }]
      : studentLinks;

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Перейти к содержимому
      </a>
      <header className="topbar">
        <Link href="/" className="brand">
          <div className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M7 22L16 10l9 12" />
              <path d="M11 22h10" />
              <circle cx="16" cy="16" r="11" opacity=".25" />
            </svg>
          </div>
          <div>
            <div className="eyebrow">ОГЭ / математика</div>
            <h1>Быстрый ход</h1>
          </div>
        </Link>
        <div className="toolbar">
          <nav className="nav-links" aria-label="Основное меню">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isCurrent(currentPath, link.href) ? 'page' : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <span className="eyebrow">{session.username}</span>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>
      <main id="main">{children}</main>
      <footer className="footer-note">Этап 1: квиз, тема, практика и разбор ошибок.</footer>
    </div>
  );
}
