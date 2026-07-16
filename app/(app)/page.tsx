import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, StatCard, Card } from "@/components/ui";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireUser();
  const staff = user.role === "ADMIN" || user.role === "PROFESSOR";

  const [students, courses, sessions, upcoming, latestNews] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.course.count(),
    prisma.classSession.count(),
    prisma.event.findMany({ where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 5 }),
    prisma.news.findMany({ orderBy: { createdAt: "desc" }, take: 3, include: { author: { select: { name: true } } } }),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle="Your school's records — people, courses, attendance and grades, all in one place."
      />

      {staff && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Students" value={students.toLocaleString()} href="/students" />
          <StatCard label="Courses" value={courses.toLocaleString()} href="/courses" />
          <StatCard label="Class sessions" value={sessions.toLocaleString()} href="/attendance" />
          <StatCard label="Upcoming events" value={upcoming.length} href="/calendar" />
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-ink-dark">Upcoming</h2>
            <Link href="/calendar" className="text-xs font-semibold text-electric">Calendar →</Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-ink-400">Nothing scheduled yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {upcoming.map((e) => (
                <li key={e.id} className="py-2.5 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-ink-dark truncate">{e.title}</span>
                  <span className="text-xs text-ink-400 shrink-0">{format(e.startsAt, "d MMM, HH:mm")}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-ink-dark">Latest news</h2>
            <Link href="/news" className="text-xs font-semibold text-electric">News →</Link>
          </div>
          {latestNews.length === 0 ? (
            <p className="text-sm text-ink-400">No announcements yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {latestNews.map((n) => (
                <li key={n.id} className="py-2.5">
                  <div className="text-sm font-semibold text-ink-dark">{n.title}</div>
                  <div className="text-xs text-ink-400 mt-0.5">
                    {n.author.name} · {format(n.createdAt, "d MMM yyyy")}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
