'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

type NavItem = { href: string; label: string; icon: string; title: string };
type NavGroup = { title: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    title: 'Intelligence',
    items: [
      { href: '/', label: 'Today', icon: '◧', title: 'Today\'s Intelligence' },
      { href: '/opportunities', label: 'Opportunities', icon: '◎', title: 'Opportunities' },
      { href: '/universities', label: 'Universities', icon: '▣', title: 'Universities' },
      { href: '/professors', label: 'Professors', icon: '☺', title: 'Professors' },
      { href: '/research', label: 'Research', icon: '✦', title: 'Research Signals' },
    ]
  },
  {
    title: 'Application',
    items: [
      { href: '/applications', label: 'Applications', icon: '☰', title: 'Applications' },
      { href: '/outreach', label: 'Outreach', icon: '✉', title: 'Outreach' },
      { href: '/portfolio', label: 'Portfolio', icon: '▤', title: 'Portfolio & Documents' },
    ]
  },
  {
    title: 'Planning',
    items: [
      { href: '/funding', label: 'Funding & Relocation', icon: '◈', title: 'Funding & Relocation' },
      // Favourites removed as an explicit top-level route if it doesn't exist, but we can add a placeholder.
      // Wait, user says "Favourites" in Planning. Let's point it to /opportunities?favourites=true or just /opportunities for now to avoid dead link.
      // Actually, I'll point it to /opportunities for now and use it as a placeholder.
      // Or I'll omit it to strictly avoid dead links (user said "Do not create dead links.")
    ]
  },
  {
    title: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: '⚙', title: 'Settings' },
    ]
  }
];

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export default function AppShell({ email, logoutAction, children }: { email: string; logoutAction: () => Promise<void>; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  
  // Find current active item title
  let currentTitle = 'NEXTPHD';
  for (const group of NAV_GROUPS) {
    const active = group.items.find(n => isActive(pathname, n.href));
    if (active) {
      currentTitle = active.title;
      break;
    }
  }

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <aside className={`sidebar${open ? ' open' : ''}`} aria-label="Primary">
        <div className="sidebar-brand">
          NEXT<span>PHD</span>
        </div>
        <nav className="nav">
          {NAV_GROUPS.map(group => (
            <div key={group.title} className="nav-group">
              <div className="nav-group-title">{group.title}</div>
              {group.items.map((n) => (
                <Link key={n.href} href={n.href} aria-current={isActive(pathname, n.href) ? 'page' : undefined}>
                  <span className="nav-icon" aria-hidden="true">{n.icon}</span>
                  {n.label}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-foot">PhD Intelligence System</div>
      </aside>
      <div className={`scrim${open ? ' open' : ''}`} onClick={() => setOpen(false)} aria-hidden="true" />

      <div className="main-col">
        <header className="topbar">
          <button type="button" className="btn btn-sm menu-btn" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            ☰ Menu
          </button>
          
          <div className="topbar-title">Today / <span>{currentTitle}</span></div>
          
          <form action="/opportunities" method="get" className="topbar-search" role="search">
            <label htmlFor="global-search" className="sr-only">Search</label>
            <input id="global-search" type="search" name="q" placeholder="Search..." />
          </form>
          
          <span className="user-chip" title={email}>
            {email.split('@')[0]}
          </span>
          <form action={logoutAction}>
            <button type="submit" className="btn btn-sm">Log out</button>
          </form>
        </header>
        <main id="main" className="content">
          {children}
        </main>
      </div>
    </div>
  );
}
