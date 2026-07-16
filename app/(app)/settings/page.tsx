import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card } from "@/components/ui";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

async function saveSchoolName(formData: FormData) {
  "use server";
  await requireRole("ADMIN");
  const schoolName = String(formData.get("schoolName") ?? "").trim() || "Your School";
  await prisma.setting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", schoolName },
    update: { schoolName },
  });
  revalidatePath("/", "layout");
  redirect("/settings?saved=1");
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const setting = await prisma.setting.findUnique({ where: { id: "singleton" } });

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader title="Settings" subtitle="Your school and this edition." />

      {sp.saved && <div className="rounded-xl bg-status-success/10 text-status-success text-sm px-3 py-2">Saved.</div>}

      <Card>
        <form action={saveSchoolName} className="space-y-3">
          <div>
            <label className="am-label">School name</label>
            <input name="schoolName" defaultValue={setting?.schoolName ?? "Your School"} className="am-input" />
            <p className="text-[11px] text-ink-400 mt-1">Shown in the top bar and on the sign-in page.</p>
          </div>
          <button className="am-btn-primary">Save</button>
        </form>
      </Card>

      <Card className="border-electric/20 bg-electric/[0.04]">
        <div className="flex items-start gap-3">
          <span className="w-9 h-9 rounded-xl bg-electric/10 text-electric grid place-items-center shrink-0"><Sparkles size={16} /></span>
          <div>
            <h3 className="text-sm font-bold text-ink-dark">You&apos;re on the Community Edition</h3>
            <p className="text-xs text-ink-400 mt-1">
              Free, self-hosted, yours to keep. Everything here is your system of record.
              Automatic attendance, AI early-warning, careers, the mobile app, integrations,
              white-label and hands-off hosting live in the Cloud edition.
            </p>
            <a href="https://aulamagna.io" target="_blank" rel="noreferrer" className="am-btn-primary text-xs mt-3 inline-flex">See the Cloud edition →</a>
          </div>
        </div>
      </Card>
    </div>
  );
}
