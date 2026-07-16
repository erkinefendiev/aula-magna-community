import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser, isStaff } from "@/lib/auth";
import { Card } from "@/components/ui";
import { addMaterial, enrollStudent, unenrollStudent, addAssignment } from "../actions";
import { ChevronLeft, ExternalLink, X } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function CourseDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const staff = isStaff(user.role);
  const { id } = await params;

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      materials: { orderBy: [{ week: "asc" }, { createdAt: "asc" }] },
      assignments: { orderBy: { createdAt: "asc" }, include: { _count: { select: { submissions: true } } } },
      enrollments: { include: { student: { select: { id: true, name: true, student: { select: { studentCode: true } } } } } },
    },
  });
  if (!course) notFound();

  // Students not yet enrolled (for the enroll picker).
  const enrolledIds = new Set(course.enrollments.map((e) => e.student.id));
  const allStudents = staff
    ? await prisma.user.findMany({ where: { role: "STUDENT" }, select: { id: true, name: true }, orderBy: { name: "asc" } })
    : [];
  const candidates = allStudents.filter((s) => !enrolledIds.has(s.id));

  return (
    <div className="space-y-6">
      <Link href="/courses" className="inline-flex items-center gap-1 text-electric text-sm font-semibold"><ChevronLeft size={16} /> Courses</Link>
      <div>
        <div className="flex items-center gap-2">
          <span className="am-pill bg-electric/10 text-electric">{course.code}</span>
          {course.programme && <span className="text-xs text-ink-400">{course.programme}</span>}
        </div>
        <h1 className="text-2xl font-extrabold text-ink-dark mt-1">{course.name}</h1>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Materials */}
        <Card>
          <h2 className="text-sm font-bold text-ink-dark mb-3">Materials</h2>
          {course.materials.length === 0 ? (
            <p className="text-sm text-ink-400">No materials yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {course.materials.map((m) => (
                <li key={m.id} className="py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-ink-dark truncate">{m.title}</div>
                    <div className="text-[11px] text-ink-400">Week {m.week} · {m.kind.toLowerCase()}</div>
                  </div>
                  {m.url && <a href={m.url} target="_blank" rel="noreferrer" className="text-electric shrink-0"><ExternalLink size={15} /></a>}
                </li>
              ))}
            </ul>
          )}
          {staff && (
            <form action={addMaterial} className="mt-4 grid grid-cols-2 gap-2 items-end border-t border-border pt-3">
              <input type="hidden" name="courseId" value={course.id} />
              <div className="col-span-2"><label className="am-label">Title</label><input name="title" required className="am-input" placeholder="Lecture 1 slides" /></div>
              <div><label className="am-label">Week</label><input name="week" type="number" min={1} defaultValue={1} className="am-input" /></div>
              <div>
                <label className="am-label">Kind</label>
                <select name="kind" className="am-input">
                  <option value="LINK">Link</option><option value="PDF">PDF</option><option value="VIDEO">Video</option><option value="SLIDES">Slides</option><option value="DOC">Doc</option><option value="NOTE">Note</option>
                </select>
              </div>
              <div className="col-span-2"><label className="am-label">URL (optional)</label><input name="url" className="am-input" placeholder="https://…" /></div>
              <button className="am-btn-primary col-span-2">Add material</button>
            </form>
          )}
        </Card>

        {/* Roster */}
        <Card>
          <h2 className="text-sm font-bold text-ink-dark mb-3">Enrolled students ({course.enrollments.length})</h2>
          {course.enrollments.length === 0 ? (
            <p className="text-sm text-ink-400">No one enrolled yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {course.enrollments.map((e) => (
                <li key={e.id} className="py-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-ink-dark">{e.student.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-ink-400">{e.student.student?.studentCode}</span>
                    {staff && (
                      <form action={unenrollStudent}>
                        <input type="hidden" name="enrollmentId" value={e.id} />
                        <input type="hidden" name="courseId" value={course.id} />
                        <button className="text-ink-400 hover:text-status-danger" title="Unenroll" aria-label="Unenroll"><X size={14} /></button>
                      </form>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {staff && candidates.length > 0 && (
            <form action={enrollStudent} className="mt-4 flex gap-2 items-end border-t border-border pt-3">
              <input type="hidden" name="courseId" value={course.id} />
              <div className="flex-1">
                <label className="am-label">Enroll a student</label>
                <select name="studentId" className="am-input">
                  {candidates.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <button className="am-btn-primary">Enroll</button>
            </form>
          )}
        </Card>
      </div>

      {/* Assignments */}
      <Card>
        <h2 className="text-sm font-bold text-ink-dark mb-3">Assignments</h2>
        {course.assignments.length === 0 ? (
          <p className="text-sm text-ink-400">No assignments yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {course.assignments.map((a) => (
              <li key={a.id} className="py-2 flex items-center justify-between gap-3">
                <div>
                  <span className="text-sm font-semibold text-ink-dark">{a.title}</span>
                  <span className="text-[11px] text-ink-400 ml-2">{a.weight}%{a.dueAt ? ` · due ${format(a.dueAt, "d MMM")}` : ""}</span>
                </div>
                <Link href={`/gradebook?assignment=${a.id}`} className="text-xs font-semibold text-electric shrink-0">{a._count.submissions} graded →</Link>
              </li>
            ))}
          </ul>
        )}
        {staff && (
          <form action={addAssignment} className="mt-4 grid sm:grid-cols-4 gap-2 items-end border-t border-border pt-3">
            <input type="hidden" name="courseId" value={course.id} />
            <div className="sm:col-span-2"><label className="am-label">Title</label><input name="title" required className="am-input" placeholder="Case study" /></div>
            <div><label className="am-label">Weight %</label><input name="weight" type="number" min={0} max={100} defaultValue={0} className="am-input" /></div>
            <div><label className="am-label">Due (optional)</label><input name="dueAt" type="date" className="am-input" /></div>
            <button className="am-btn-primary sm:col-span-4 sm:w-auto sm:justify-self-start">Add assignment</button>
          </form>
        )}
      </Card>
    </div>
  );
}
