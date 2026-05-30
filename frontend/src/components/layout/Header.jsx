import { useState } from 'react';
import { CircleUserRound, Menu, Search, Settings } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function Header({ title }) {
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const roleLabel = user?.role ?? 'Admin';
  const role = user?.role?.toLowerCase();

  if (role === 'superadmin') {
    const initials = (user?.full_name || user?.email || 'Super Admin')
      .split(/[.\s@_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('');

    return (
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#c3c6d6] bg-[#f8f9fb] px-4 shadow-sm lg:px-8">
        <div className="flex min-w-0 items-center gap-4">
          <button
            type="button"
            className="rounded-full p-2 text-[#191c1e] transition hover:bg-[#e7e8ea] md:hidden"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="truncate text-xl font-black tracking-tight text-[#003d9b] md:text-2xl">
            {title || 'Infrastructure Control'}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="rounded-full p-2 text-[#191c1e] transition hover:bg-[#e7e8ea] hover:text-[#003d9b]"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
          <div className="mx-2 h-6 w-px bg-[#c3c6d6]" />
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex h-9 w-9 items-center justify-center rounded border border-[#c3c6d6] bg-[#0052cc] text-xs font-bold text-white transition hover:bg-[#003d9b]"
            aria-label="Account"
          >
            {initials || <CircleUserRound className="h-5 w-5" />}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-[#c3c6d6] bg-[#f8f9fb] px-4 shadow-sm md:px-8">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          className="rounded-full p-2 text-[#434654] transition hover:bg-[#e7e8ea] md:hidden"
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        {title && <h1 className="truncate text-lg font-black tracking-tight text-[#003d9b] md:text-xl">{title}</h1>}
        <div className="relative hidden w-80 max-w-[32vw] group lg:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#434654] transition-colors group-focus-within:text-[#003d9b]" />
          <input
            type="text"
            placeholder="Search precincts..."
            className="w-full rounded border-0 bg-[#edeef0] py-2 pl-9 pr-3 text-sm text-[#191c1e] transition focus:outline-none focus:ring-2 focus:ring-[#003d9b]"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="rounded-full p-2 text-[#434654] transition hover:bg-[#e7e8ea] hover:text-[#003d9b]"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>

        <div className="hidden h-8 w-px bg-[#c3c6d6] md:block" />

        <div className="hidden items-center gap-3 md:flex">
          <span className="text-xs font-semibold uppercase tracking-[0.05em] text-[#434654]">
            {user?.tenant_name || roleLabel}
          </span>
          <button
            type="button"
            onClick={() => navigate('/settings')}
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded border border-[#c3c6d6] bg-[#0052cc] text-xs font-bold uppercase text-white transition hover:bg-[#003d9b]"
            aria-label="Account"
          >
            <span>
              {user?.full_name ? user.full_name.charAt(0) : user?.email?.charAt(0) ?? 'A'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
