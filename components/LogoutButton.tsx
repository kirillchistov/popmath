'use client';

import { IconLogout } from './Icons';

export function LogoutButton() {
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <button
      className="icon-btn"
      type="button"
      onClick={logout}
      aria-label="Выйти"
      title="Выйти"
    >
      <IconLogout />
    </button>
  );
}
