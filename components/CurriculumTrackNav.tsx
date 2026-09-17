"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui";

const TRACKS = [
  { label: "Overview", href: "/career" },
  { label: "System Design", href: "/career/system-design" },
  { label: "LeetCode", href: "/career/leetcode" },
];

function isActiveTrack(pathname: string, href: string) {
  if (href === "/career") {
    return pathname === "/career";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function CurriculumTrackNav() {
  const pathname = usePathname() || "/career";

  return (
    <nav
      className="mb-6 flex flex-wrap gap-2"
      aria-label="Career curriculum tracks"
    >
      {TRACKS.map((track) => {
        const active = isActiveTrack(pathname, track.href);
        return (
          <Link
            key={track.href}
            href={track.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-9 items-center justify-center rounded-lg border px-3.5 py-1.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[rgba(49,95,86,0.28)]",
              active
                ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-white"
                : "border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--muted)] hover:bg-[color:var(--surface-muted)] hover:text-[color:var(--text)]",
            )}
          >
            {track.label}
          </Link>
        );
      })}
    </nav>
  );
}
