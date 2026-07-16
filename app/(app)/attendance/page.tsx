import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { createSession } from "./actions";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AttendancePage() {
  await requireRole("ADMIN", "PROFESSOR");
  const [courses, sessions] = await Promise.all([
    prisma.course.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    prisma.classSession.findMany({
      orderBy: { scheduledAt: "desc" },
      take: 40,
      include: { course: { select: { code: true } }, _count: { select: { attendance: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Attendance" subtitle="Create a class session, then mark who was present by hand." />

      <Card>
        <h2 className="text-sm font-bold text-ink-dark mb-3">New class session</h2>
        {courses.length === 0 ? (
          <p className="text-sm text-ink-400">Add a course first.</p>
        ) : (
          <form action={createSession} className="grid sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="am-label">Course</label>
              <select name="courseId" className="am-input">
                {courses.map((c) => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
              </select>
            </div>
            <div><label className="am-label">Date &amp; time</label><input name="scheduledAt" type="datetime-local" required className="am-input" /></div>
            <div><label className="am-label">Topic</label><input name="topic" className="am-input" placeholder="Lecture 3" /></div>
            <button className="am-btn-primary">Create &amp; mark</button>
          </form>
        )}
      </Card>

      {sessions.length === 0 ? (
        <EmptyState title="No sessions yet" hint="Create your first class session above." />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-soft border-b border-border">
                <tr><th className="am-th">Date</th><th className="am-th">Course</th><th className="am-th">Topic</th><th className="am-th">Marked</th><th className="am-th"></th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="am-td">{format(s.scheduledAt, "d MMM yyyy, HH:mm")}</td>
                    <td className="am-td"><span className="am-pill bg-electric/10 text-electric">{s.course.code}</span></td>
                    <td className="am-td">{s.topic || "—"}</td>
                    <td className="am-td text-ink-400">{s._count.attendance} recorded</td>
                    <td className="am-td text-right"><Link href={`/attendance/${s.id}`} className="text-xs font-semibold text-electric">Mark →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
