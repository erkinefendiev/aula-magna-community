import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

async function startThread(formData: FormData) {
  "use server";
  const me = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!title || !body) return;
  const thread = await prisma.forumThread.create({ data: { title, authorId: me.id, posts: { create: { authorId: me.id, body } } } });
  revalidatePath("/forum");
  redirect(`/forum/${thread.id}`);
}

export default async function ForumPage() {
  await requireUser();
  const threads = await prisma.forumThread.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } }, _count: { select: { posts: true } }, posts: { orderBy: { createdAt: "desc" }, take: 1, select: { createdAt: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Forum" subtitle="Ask questions and talk with the whole school." />

      <Card>
        <h2 className="text-sm font-bold text-ink-dark mb-3">Start a thread</h2>
        <form action={startThread} className="space-y-3">
          <div><label className="am-label">Title</label><input name="title" required className="am-input" placeholder="Where do I find the reading list?" /></div>
          <div><label className="am-label">Message</label><textarea name="body" required className="am-input min-h-[80px]" /></div>
          <button className="am-btn-primary">Post thread</button>
        </form>
      </Card>

      {threads.length === 0 ? (
        <EmptyState title="No threads yet" hint="Start the first conversation above." />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <ul className="divide-y divide-border">
            {threads.map((th) => (
              <li key={th.id}>
                <Link href={`/forum/${th.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-soft/60">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink-dark truncate">{th.title}</div>
                    <div className="text-[11px] text-ink-400">by {th.author.name} · {formatDistanceToNowStrict(th.posts[0]?.createdAt ?? th.createdAt)} ago</div>
                  </div>
                  <span className="am-pill bg-surface-soft text-ink-400 shrink-0"><MessageSquare size={11} /> {th._count.posts}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
