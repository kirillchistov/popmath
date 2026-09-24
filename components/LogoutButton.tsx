'use client';

export function LogoutButton() {
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <button className="btn btn-ghost" type="button" onClick={logout}>
      Выйти
    </button>
  );
}
