import { prisma } from "@/lib/db";
import { requireUser, requireRole, isStaff } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { revalidatePath } from "next/cache";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

async function postNews(formData: FormData) {
  "use server";
  const me = await requireRole("ADMIN", "PROFESSOR");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;
  await prisma.news.create({ data: { title, body, authorId: me.id } });
  revalidatePath("/news");
}

export default async function NewsPage() {
  const user = await requireUser();
  const staff = isStaff(user.role);
  const items = await prisma.news.findMany({ orderBy: { createdAt: "desc" }, include: { author: { select: { name: true } } } });

  return (
    <div className="space-y-6">
      <PageHeader title="News" subtitle="Announcements for the whole school." />

      {staff && (
        <Card>
          <h2 className="text-sm font-bold text-ink-dark mb-3">Post an announcement</h2>
          <form action={postNews} className="space-y-3">
            <div><label className="am-label">Title</label><input name="title" required className="am-input" placeholder="Enrolment opens Monday" /></div>
            <div><label className="am-label">Message</label><textarea name="body" required className="am-input min-h-[100px]" placeholder="Write your announcement…" /></div>
            <button className="am-btn-primary">Publish</button>
          </form>
        </Card>
      )}

      {items.length === 0 ? (
        <EmptyState title="No news yet" />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card key={n.id}>
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-bold text-ink-dark">{n.title}</h3>
                <span className="text-[11px] text-ink-400 shrink-0">{format(n.createdAt, "d MMM yyyy")}</span>
              </div>
              <p className="text-sm text-ink mt-1.5 whitespace-pre-wrap">{n.body}</p>
              <p className="text-[11px] text-ink-400 mt-2">— {n.author.name}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
