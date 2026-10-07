'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

const NAV: Array<{ href: string; label: string; icon: string; title: string }> = [
  { href: '/', label: 'Dashboard', icon: '◧', title: 'Today' },
  { href: '/opportunities', label: 'Opportunities', icon: '◎', title: 'Opportunities' },
  { href: '/universities', label: 'Universities', icon: '▣', title: 'Universities' },
  { href: '/professors', label: 'Professors', icon: '☺', title: 'Professors' },
  { href: '/research', label: 'Research', icon: '✦', title: 'Research' },
  { href: '/applications', label: 'Applications', icon: '☰', title: 'Applications' },
  { href: '/outreach', label: 'Outreach', icon: '✉', title: 'Outreach' },
  { href: '/portfolio', label: 'Portfolio', icon: '▤', title: 'Portfolio & Documents' },
  { href: '/funding', label: 'Funding & Relocation', icon: '◈', title: 'Funding & Relocation' },
  { href: '/settings', label: 'Settings', icon: '⚙', title: 'Settings & Profile' },
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ email, logoutAction, children }: { email: string; logoutAction: () => Promise<void>; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = NAV.find((n) => isActive(pathname, n.href));

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="shell">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Primary">
        <div className="sidebar-brand">
          NEXT<span>PHD</span>
        </div>
        <nav className="nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} aria-current={isActive(pathname, n.href) ? 'page' : undefined}>
              <span className="nav-icon" aria-hidden="true">
                {n.icon}
              </span>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">PhD Intelligence &amp; Application System</div>
      </aside>
      <div className={`scrim${open ? ' open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />

      <div className="main-col">
        <header className="topbar">
          <button type="button" className="btn btn-sm menu-btn" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            ☰ Menu
          </button>
          <div className="topbar-title">{current?.title ?? 'NEXTPHD'}</div>
          <form action="/opportunities" method="get" className="topbar-search" role="search">
            <label htmlFor="global-search" className="sr-only">
              Search opportunities
            </label>
            <input id="global-search" type="search" name="q" placeholder="Search opportunities…" />
          </form>
          <span className="user-chip" title={email}>
            {email}
          </span>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-sm">
              Log out
            </button>
          </form>
        </header>
        <main id="main" className="content">
          {children}
        </main>
      </div>
    </div>
  );
}
