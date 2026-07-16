import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { revalidatePath } from "next/cache";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

async function reply(formData: FormData) {
  "use server";
  const me = await requireUser();
  const threadId = String(formData.get("threadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!threadId || !body) return;
  await prisma.forumPost.create({ data: { threadId, authorId: me.id, body } });
  revalidatePath(`/forum/${threadId}`);
}

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const thread = await prisma.forumThread.findUnique({
    where: { id },
    include: { author: { select: { name: true } }, posts: { orderBy: { createdAt: "asc" }, include: { author: { select: { name: true, role: true } } } } },
  });
  if (!thread) notFound();

  return (
    <div className="space-y-5 max-w-2xl">
      <Link href="/forum" className="inline-flex items-center gap-1 text-electric text-sm font-semibold"><ChevronLeft size={16} /> Forum</Link>
      <h1 className="text-xl font-extrabold text-ink-dark">{thread.title}</h1>

      <div className="space-y-3">
        {thread.posts.map((p) => (
          <Card key={p.id}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-bold text-ink-dark">{p.author.name} <span className="text-[10px] font-normal text-ink-400 uppercase">{p.author.role.toLowerCase()}</span></span>
              <span className="text-[11px] text-ink-400">{format(p.createdAt, "d MMM, HH:mm")}</span>
            </div>
            <p className="text-sm text-ink mt-1.5 whitespace-pre-wrap">{p.body}</p>
          </Card>
        ))}
      </div>

      <Card>
        <form action={reply} className="space-y-3">
          <input type="hidden" name="threadId" value={thread.id} />
          <textarea name="body" required className="am-input min-h-[80px]" placeholder="Write a reply…" />
          <div className="flex justify-end"><button className="am-btn-primary">Reply</button></div>
        </form>
      </Card>
    </div>
  );
}
