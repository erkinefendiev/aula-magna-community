"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Community nav — only the free "system of record" surfaces. Ordered; staff see
// management pages, students see the read/participate ones.
const ALL = [
  { href: "/", label: "Home", roles: ["ADMIN", "PROFESSOR", "STUDENT"] },
  { href: "/students", label: "Students", roles: ["ADMIN", "PROFESSOR"] },
  { href: "/courses", label: "Courses", roles: ["ADMIN", "PROFESSOR", "STUDENT"] },
  { href: "/attendance", label: "Attendance", roles: ["ADMIN", "PROFESSOR"] },
  { href: "/gradebook", label: "Gradebook", roles: ["ADMIN", "PROFESSOR"] },
  { href: "/calendar", label: "Calendar", roles: ["ADMIN", "PROFESSOR", "STUDENT"] },
  { href: "/forum", label: "Forum", roles: ["ADMIN", "PROFESSOR", "STUDENT"] },
  { href: "/news", label: "News", roles: ["ADMIN", "PROFESSOR", "STUDENT"] },
  { href: "/documents", label: "Documents", roles: ["ADMIN", "PROFESSOR", "STUDENT"] },
  { href: "/settings", label: "Settings", roles: ["ADMIN"] },
];

export function Nav({ role }: { role: string }) {
  const pathname = usePathname();
  const items = ALL.filter((i) => i.roles.includes(role));
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <nav className="bg-surface border-b border-border">
      <div className="container mx-auto px-5 overflow-x-auto">
        <ul className="flex gap-1">
          {items.map((i) => (
            <li key={i.href}>
              <Link
                href={i.href}
                className={`inline-flex items-center px-3.5 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  isActive(i.href) ? "border-pink text-ink-dark" : "border-transparent text-ink-400 hover:text-ink-dark"
                }`}
              >
                {i.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
