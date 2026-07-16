import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { login } from "./actions";
import { GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getSessionUser()) redirect("/");
  const sp = await searchParams;

  return (
    <div className="min-h-screen grid place-items-center px-4 bg-surface-muted">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <span className="w-9 h-9 rounded-xl bg-electric text-white grid place-items-center">
            <GraduationCap size={18} />
          </span>
          <span className="text-lg font-extrabold text-ink-dark">Aula Magna</span>
          <span className="am-pill bg-electric/10 text-electric">Community</span>
        </div>

        <form action={login} className="am-card p-6 space-y-4">
          <div>
            <h1 className="text-xl font-extrabold text-ink-dark">Sign in</h1>
            <p className="text-sm text-ink-400 mt-1">Your school&apos;s system of record.</p>
          </div>
          {sp.error && (
            <p className="rounded-xl bg-status-danger/10 text-status-danger text-sm px-3 py-2">
              Wrong email or password.
            </p>
          )}
          <div>
            <label className="am-label" htmlFor="email">Email</label>
            <input id="email" name="email" type="email" required autoFocus className="am-input" placeholder="you@school.edu" />
          </div>
          <div>
            <label className="am-label" htmlFor="password">Password</label>
            <input id="password" name="password" type="password" required className="am-input" placeholder="••••••••" />
          </div>
          <button className="am-btn-primary w-full">Sign in</button>
        </form>

        <p className="text-center text-[11px] text-ink-400 mt-5">
          Powered by{" "}
          <a href="https://aulamagna.io" className="font-semibold text-electric" target="_blank" rel="noreferrer">Aula Magna</a>
          {" "}· Community Edition
        </p>
      </div>
    </div>
  );
}
