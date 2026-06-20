"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { SITE } from "@/lib/constants";
import ThemeToggle from "./ThemeToggle";

const NAV = [
  { href: "/datasets", label: "Datasets" },
  { href: "/overview", label: "Overview" },
  { href: "/learn", label: "Learn" },
  { href: "/resources", label: "Resources" },
  { href: "/contribute", label: "Contribute" },
  { href: "/about", label: "About" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-content items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-brand text-brand-fg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="5" cy="6" r="2.2" />
              <circle cx="19" cy="6" r="2.2" />
              <circle cx="12" cy="18" r="2.2" />
              <path d="M6.8 7.2 10.6 16M17.2 7.2 13.4 16M7 6h10" />
            </svg>
          </span>
          <span className="hidden sm:inline">{SITE.name}</span>
          <span className="sm:hidden">{SITE.shortName}</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-surface-2 text-fg"
                  : "text-muted hover:bg-surface-2 hover:text-fg"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={SITE.repo}
            target="_blank"
            rel="noreferrer noopener"
            className="ml-1 rounded-md px-3 py-2 text-sm font-medium text-muted hover:text-fg"
          >
            GitHub
          </a>
          <div className="ml-1">
            <ThemeToggle />
          </div>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-border bg-surface px-4 py-2 md:hidden">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                isActive(item.href) ? "bg-surface-2 text-fg" : "text-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={SITE.repo}
            target="_blank"
            rel="noreferrer noopener"
            className="block rounded-md px-3 py-2 text-sm font-medium text-muted"
          >
            GitHub
          </a>
        </nav>
      )}
    </header>
  );
}
