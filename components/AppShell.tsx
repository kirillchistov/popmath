import Link from 'next/link';
import { AppNav } from './AppNav';
import type { SessionPayload } from '@/lib/types';

const studentLinks = [
  { href: '/', label: 'Сегодня' },
  { href: '/quiz', label: 'Квиз' },
  { href: '/task', label: 'Темы' },
  { href: '/review', label: 'Разбор' },
  { href: '/map', label: 'Карта' },
];

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
        <AppNav username={session.username} currentPath={currentPath} links={links} />
      </header>
      <main id="main">{children}</main>
      <footer className="footer-note">Этап 2: сегодня один шаг и очередь на неделю.</footer>
    </div>
  );
}
