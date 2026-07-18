import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader, StatCard, Card } from "@/components/ui";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

// Grade bands (0–100). Ordered high → low, coloured green → red.
const BANDS = [
  { label: "90–100", min: 90, color: "rgb(var(--success))" },
  { label: "80–89", min: 80, color: "rgb(var(--electric))" },
  { label: "70–79", min: 70, color: "rgb(var(--warning))" },
  { label: "60–69", min: 60, color: "rgb(var(--pink))" },
  { label: "Below 60", min: 0, color: "rgb(var(--danger))" },
];
const PASS_MARK = 50;

export default async function HomePage() {
  const user = await requireUser();
  const staff = user.role === "ADMIN" || user.role === "PROFESSOR";

  const [students, courses, sessions, upcoming, latestNews, gradedSubs] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.course.count(),
    prisma.classSession.count(),
    prisma.event.findMany({ where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 5 }),
    prisma.news.findMany({ orderBy: { createdAt: "desc" }, take: 3, include: { author: { select: { name: true } } } }),
    // Every graded submission across the school, with its course, for the summary.
    prisma.submission.findMany({
      where: { score: { not: null } },
      select: { score: true, assignment: { select: { courseId: true, course: { select: { code: true, name: true } } } } },
    }),
  ]);

  // ── School-wide grade summary ────────────────────────────────────────────────
  const scores = gradedSubs.map((s) => s.score as number);
  const gradedCount = scores.length;
  const avg = gradedCount ? scores.reduce((a, b) => a + b, 0) / gradedCount : null;
  const passRate = gradedCount ? scores.filter((s) => s >= PASS_MARK).length / gradedCount : null;

  const bands = BANDS.map((b, i) => {
    const upper = i === 0 ? Infinity : BANDS[i - 1].min;
    const count = scores.filter((s) => s >= b.min && s < upper).length;
    return { ...b, count, pct: gradedCount ? (count / gradedCount) * 100 : 0 };
  });

  const byCourse = new Map<string, { code: string; name: string; sum: number; n: number }>();
  for (const s of gradedSubs) {
    const c = s.assignment.course;
    const cur = byCourse.get(s.assignment.courseId) ?? { code: c.code, name: c.name, sum: 0, n: 0 };
    cur.sum += s.score as number;
    cur.n += 1;
    byCourse.set(s.assignment.courseId, cur);
  }
  const courseAverages = [...byCourse.values()]
    .map((c) => ({ code: c.code, name: c.name, avg: c.sum / c.n }))
    .sort((a, b) => b.avg - a.avg);

  // ── A student's own grades ────────────────────────────────────────────────────
  const mySubs = staff
    ? []
    : await prisma.submission.findMany({
        where: { studentId: user.id, score: { not: null } },
        orderBy: { gradedAt: "desc" },
        select: { score: true, assignment: { select: { title: true, course: { select: { code: true } } } } },
      });
  const myAvg = mySubs.length ? mySubs.reduce((a, s) => a + (s.score as number), 0) / mySubs.length : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user.name.split(" ")[0]}`}
        subtitle="Your school's records — people, courses, attendance and grades, all in one place."
      />

      {staff && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <StatCard label="Students" value={students.toLocaleString()} href="/students" />
          <StatCard label="Courses" value={courses.toLocaleString()} href="/courses" />
          <StatCard label="Class sessions" value={sessions.toLocaleString()} href="/attendance" />
          <StatCard label="Avg. grade" value={avg != null ? avg.toFixed(1) : "—"} href="/gradebook" />
          <StatCard label="Upcoming events" value={upcoming.length} href="/calendar" />
        </div>
      )}

      {/* School-wide grades summary (staff) */}
      {staff && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-ink-dark">Grades across the school</h2>
            <Link href="/gradebook" className="text-xs font-semibold text-electric">Gradebook →</Link>
          </div>

          {gradedCount === 0 ? (
            <p className="text-sm text-ink-400">
              No grades recorded yet. Enter grades in the gradebook — or run{" "}
              <code className="rounded bg-surface-soft px-1 py-0.5 text-[12px] text-ink-dark">npm run db:seed:demo</code>{" "}
              to load sample data.
            </p>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Left: headline numbers + distribution */}
              <div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-3xl font-extrabold text-ink-dark tabular-nums">{avg!.toFixed(1)}</div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-ink-400 mt-0.5">Average</div>
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold text-ink-dark tabular-nums">{Math.round(passRate! * 100)}%</div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-ink-400 mt-0.5">Pass rate</div>
                  </div>
                  <div>
                    <div className="text-3xl font-extrabold text-ink-dark tabular-nums">{gradedCount.toLocaleString()}</div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-ink-400 mt-0.5">Graded</div>
                  </div>
                </div>

                {/* Distribution bar */}
                <div className="mt-5">
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-soft">
                    {bands.map((b) =>
                      b.pct > 0 ? <div key={b.label} style={{ width: `${b.pct}%`, background: b.color }} title={`${b.label}: ${b.count}`} /> : null,
                    )}
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {bands.map((b) => (
                      <li key={b.label} className="flex items-center gap-2 text-xs">
                        <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ background: b.color }} />
                        <span className="text-ink-400">{b.label}</span>
                        <span className="ml-auto font-semibold text-ink-dark tabular-nums">{b.count}</span>
                        <span className="w-10 text-right text-ink-400 tabular-nums">{Math.round(b.pct)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right: average by course */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-widest text-ink-400 mb-2">Average by course</div>
                <ul className="space-y-2.5">
                  {courseAverages.map((c) => (
                    <li key={c.code}>
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold text-ink-dark truncate">
                          {c.code} <span className="font-normal text-ink-400">· {c.name}</span>
                        </span>
                        <span className="text-sm font-bold text-ink-dark tabular-nums shrink-0">{c.avg.toFixed(1)}</span>
                      </div>
                      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-soft">
                        <div className="h-full rounded-full bg-electric" style={{ width: `${c.avg}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* A student's own grade snapshot */}
      {!staff && mySubs.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-ink-dark">Your grades</h2>
            <div className="text-right">
              <span className="text-2xl font-extrabold text-ink-dark tabular-nums">{myAvg!.toFixed(1)}</span>
              <span className="ml-1 text-[11px] font-bold uppercase tracking-widest text-ink-400">avg</span>
            </div>
          </div>
          <ul className="divide-y divide-border">
            {mySubs.slice(0, 6).map((s, i) => (
              <li key={i} className="py-2 flex items-center justify-between gap-3">
                <span className="text-sm text-ink-dark truncate">
                  <span className="font-semibold">{s.assignment.course.code}</span> · {s.assignment.title}
                </span>
                <span className="text-sm font-bold text-ink-dark tabular-nums shrink-0">{s.score}</span>
              </li>
            ))}
          </ul>
        </Card>
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
