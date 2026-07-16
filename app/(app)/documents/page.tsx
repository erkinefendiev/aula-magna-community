import { prisma } from "@/lib/db";
import { requireUser, requireRole, isStaff } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { revalidatePath } from "next/cache";
import { FileText, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

async function addDocument(formData: FormData) {
  "use server";
  await requireRole("ADMIN", "PROFESSOR");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const url = String(formData.get("url") ?? "").trim() || null;
  if (!title) return;
  await prisma.document.create({ data: { title, description, url } });
  revalidatePath("/documents");
}

export default async function DocumentsPage() {
  const user = await requireUser();
  const staff = isStaff(user.role);
  const docs = await prisma.document.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <PageHeader title="Documents" subtitle="Handbooks, policies and forms your school shares." />

      {staff && (
        <Card>
          <h2 className="text-sm font-bold text-ink-dark mb-3">Add a document</h2>
          <form action={addDocument} className="grid sm:grid-cols-3 gap-3 items-end">
            <div><label className="am-label">Title</label><input name="title" required className="am-input" placeholder="Student handbook" /></div>
            <div><label className="am-label">Link (optional)</label><input name="url" className="am-input" placeholder="https://…" /></div>
            <div><label className="am-label">Description</label><input name="description" className="am-input" placeholder="2025–26 edition" /></div>
            <button className="am-btn-primary">Add</button>
          </form>
        </Card>
      )}

      {docs.length === 0 ? (
        <EmptyState title="No documents yet" />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <ul className="divide-y divide-border">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-electric/10 text-electric grid place-items-center shrink-0"><FileText size={15} /></span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink-dark truncate">{d.title}</div>
                    {d.description && <div className="text-[11px] text-ink-400 truncate">{d.description}</div>}
                  </div>
                </div>
                {d.url && <a href={d.url} target="_blank" rel="noreferrer" className="text-electric shrink-0"><ExternalLink size={16} /></a>}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
