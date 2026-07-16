import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { saveGrades } from "./actions";

export const dynamic = "force-dynamic";

export default async function GradebookPage({ searchParams }: { searchParams: Promise<{ course?: string; assignment?: string }> }) {
  await requireRole("ADMIN", "PROFESSOR");
  const sp = await searchParams;

  // Resolve selected assignment (directly or via course).
  const assignment = sp.assignment
    ? await prisma.assignmentDef.findUnique({
        where: { id: sp.assignment },
        include: {
          course: {
            include: {
              enrollments: { include: { student: { select: { id: true, name: true, student: { select: { studentCode: true } } } } }, orderBy: { student: { name: "asc" } } },
            },
          },
          submissions: true,
        },
      })
    : null;

  const courseId = assignment?.courseId ?? sp.course;
  const courses = await prisma.course.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } });
  const assignments = courseId
    ? await prisma.assignmentDef.findMany({ where: { courseId }, orderBy: { createdAt: "asc" }, select: { id: true, title: true, weight: true } })
    : [];

  const scores = new Map((assignment?.submissions ?? []).map((s) => [s.studentId, s.score ?? ""]));

  return (
    <div className="space-y-6">
      <PageHeader title="Gradebook" subtitle="Pick a course and assignment, then type each grade in." />

      {/* Course + assignment pickers */}
      <Card>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="am-label">Course</label>
            <div className="flex flex-wrap gap-1.5">
              {courses.map((c) => (
                <Link key={c.id} href={`/gradebook?course=${c.id}`}
                  className={`am-pill border px-2.5 py-1 ${courseId === c.id ? "bg-electric border-electric text-white" : "border-border text-ink-400 hover:border-electric"}`}>
                  {c.code}
                </Link>
              ))}
              {courses.length === 0 && <span className="text-sm text-ink-400">Add a course first.</span>}
            </div>
          </div>
          {courseId && (
            <div>
              <label className="am-label">Assignment</label>
              <div className="flex flex-wrap gap-1.5">
                {assignments.map((a) => (
                  <Link key={a.id} href={`/gradebook?assignment=${a.id}`}
                    className={`am-pill border px-2.5 py-1 ${assignment?.id === a.id ? "bg-electric border-electric text-white" : "border-border text-ink-400 hover:border-electric"}`}>
                    {a.title}
                  </Link>
                ))}
                {assignments.length === 0 && <span className="text-sm text-ink-400">No assignments — add one on the course page.</span>}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Grade grid */}
      {assignment ? (
        assignment.course.enrollments.length === 0 ? (
          <EmptyState title="No students enrolled" hint="Enroll students in this course to grade them." />
        ) : (
          <form action={saveGrades}>
            <input type="hidden" name="assignmentId" value={assignment.id} />
            <Card className="!p-0 overflow-hidden">
              <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                <div className="font-bold text-ink-dark">{assignment.title} <span className="text-xs font-normal text-ink-400">· {assignment.course.code} · {assignment.weight}%</span></div>
                <span className="text-[11px] text-ink-400">Scores 0–100</span>
              </div>
              <table className="w-full">
                <thead className="bg-surface-soft border-b border-border">
                  <tr><th className="am-th">Student</th><th className="am-th">Code</th><th className="am-th text-right pr-5">Score</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assignment.course.enrollments.map((e) => (
                    <tr key={e.id}>
                      <td className="am-td font-semibold">{e.student.name}</td>
                      <td className="am-td text-ink-400">{e.student.student?.studentCode}</td>
                      <td className="am-td text-right">
                        <input name={`g_${e.student.id}`} type="number" min={0} max={100} defaultValue={String(scores.get(e.student.id) ?? "")} className="am-input w-24 text-right inline-block" placeholder="—" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <div className="mt-4 flex justify-end"><button className="am-btn-primary">Save grades</button></div>
          </form>
        )
      ) : (
        <EmptyState title="Pick an assignment" hint="Choose a course, then an assignment to start grading." />
      )}
    </div>
  );
}
