import Link from "next/link";
import { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-5">
      <div>
        <h1 className="text-xl font-extrabold text-ink-dark tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-ink-400 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, href }: { label: string; value: ReactNode; href?: string }) {
  const inner = (
    <div className="am-card p-4 h-full">
      <div className="text-[11px] font-bold uppercase tracking-widest text-ink-400">{label}</div>
      <div className="text-3xl font-extrabold text-ink-dark mt-1 tabular-nums">{value}</div>
    </div>
  );
  return href ? <Link href={href} className="block hover:opacity-90 transition">{inner}</Link> : inner;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="am-card p-10 text-center">
      <p className="font-bold text-ink-dark">{title}</p>
      {hint && <p className="text-sm text-ink-400 mt-1">{hint}</p>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`am-card p-5 ${className}`}>{children}</div>;
}
