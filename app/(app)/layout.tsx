import { GraduationCap } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Nav } from "./nav";
import { signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const setting = await prisma.setting.findUnique({ where: { id: "singleton" } });
  const schoolName = setting?.schoolName ?? "Your School";

  return (
    <div className="min-h-screen flex flex-col bg-surface-muted">
      {/* Top bar */}
      <header className="bg-ink-dark text-white">
        <div className="container mx-auto px-5 py-3 flex items-center gap-4">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-electric grid place-items-center shrink-0">
              <GraduationCap size={16} />
            </span>
            <span className="font-extrabold tracking-tight truncate">{schoolName}</span>
            <span className="am-pill bg-white/10 text-white/80 hidden sm:inline-flex">Community</span>
          </div>
          <div className="flex-1" />
          <div className="text-right hidden sm:block leading-tight">
            <div className="text-sm font-semibold">{user.name}</div>
            <div className="text-[10px] text-white/60 uppercase tracking-widest">{user.role.toLowerCase()}</div>
          </div>
          <form action={signOut}>
            <button className="am-btn bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 text-xs">Sign out</button>
          </form>
        </div>
      </header>

      <Nav role={user.role} />

      <main className="container mx-auto px-5 py-6 flex-1 w-full">{children}</main>

      {/* Powered-by footer — free edition carries the brand. */}
      <footer className="border-t border-border py-5">
        <div className="container mx-auto px-5 text-center text-[11px] text-ink-400">
          Powered by{" "}
          <a href="https://aulamagna.io" className="font-semibold text-electric" target="_blank" rel="noreferrer">
            Aula Magna
          </a>{" "}
          · Community Edition · self-hosted &amp; free.{" "}
          <a href="https://aulamagna.io" className="text-electric" target="_blank" rel="noreferrer">
            Upgrade to Cloud →
          </a>
        </div>
      </footer>
    </div>
  );
}
