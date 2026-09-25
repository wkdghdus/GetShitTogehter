"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

type NavItem = {
  label: string;
  href: string;
  token: string;
};

export const primaryRoutes: NavItem[] = [
  { label: "Today", href: "/", token: "TD" },
  { label: "Career", href: "/career", token: "CR" },
  { label: "Physical", href: "/physical", token: "PH" },
  { label: "Applications", href: "/applications", token: "AP" },
  { label: "Projects", href: "/projects", token: "PR" },
  { label: "School", href: "/school", token: "SC" },
  { label: "Admin", href: "/admin", token: "AD" },
  { label: "Work Board", href: "/work", token: "WB" },
  { label: "Life & Recovery", href: "/life-recovery", token: "LR" },
  { label: "Focus", href: "/focus", token: "FO" },
  { label: "Weekly Review", href: "/weekly-review", token: "WR" },
  { label: "Settings", href: "/settings", token: "ST" },
];

// Positional indices into primaryRoutes — inserting a route above any of these shifts it.
const mobileTabs = [
  primaryRoutes[0],
  primaryRoutes[2],
  primaryRoutes[9],
  primaryRoutes[11],
];

function isActivePath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavigationLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="nav-list" aria-label="Primary navigation">
      {primaryRoutes.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="nav-link focus-ring"
          data-active={isActivePath(pathname, item.href)}
          aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
          onClick={onNavigate}
        >
          <span className="nav-token" aria-hidden="true">
            {item.token}
          </span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const [menuOpen, setMenuOpen] = useState(false);

  const currentRoute = useMemo(() => {
    return (
      primaryRoutes.find((item) => isActivePath(pathname, item.href)) ||
      primaryRoutes[0]
    );
  }, [pathname]);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <aside className="sidebar" aria-label="Routine dashboard navigation">
        <div className="sidebar-inner">
          <div className="brand">
            <span className="brand-title">Routine Dashboard</span>
            <span className="brand-subtitle">
              One body win, one responsibility, one future win.
            </span>
          </div>

          <NavigationLinks pathname={pathname} />

          <p className="sidebar-note">
            Once the three weekday wins are handled, the day can be complete.
            Rest and relationships are part of the routine.
          </p>
        </div>
      </aside>

      <header className="mobile-header">
        <div className="mobile-title">
          <strong>Routine Dashboard</strong>
          <span>{currentRoute.label}</span>
        </div>
        <button
          type="button"
          className="mobile-menu-button focus-ring"
          aria-expanded={menuOpen}
          aria-controls="mobile-primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          Menu
        </button>
      </header>

      {menuOpen ? (
        <div className="mobile-drawer" id="mobile-primary-navigation">
          <NavigationLinks
            pathname={pathname}
            onNavigate={() => setMenuOpen(false)}
          />
        </div>
      ) : null}

      <main className="content-shell" id="main-content" tabIndex={-1}>
        <div className="content-inner page-surface">{children}</div>
      </main>

      <nav className="mobile-nav" aria-label="Common sections">
        {mobileTabs.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="mobile-tab focus-ring"
            data-active={isActivePath(pathname, item.href)}
            aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
            onClick={() => setMenuOpen(false)}
          >
            <span className="nav-token" aria-hidden="true">
              {item.token}
            </span>
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
