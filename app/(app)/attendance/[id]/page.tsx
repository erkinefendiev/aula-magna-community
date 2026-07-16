import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Card } from "@/components/ui";
import { saveAttendance } from "../actions";
import { ChevronLeft } from "lucide-react";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

const STATUSES = ["PRESENT", "ABSENT", "LATE"] as const;

export default async function MarkAttendance({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("ADMIN", "PROFESSOR");
  const { id } = await params;

  const session = await prisma.classSession.findUnique({
    where: { id },
    include: {
      course: {
        include: {
          enrollments: { include: { student: { select: { id: true, name: true, student: { select: { studentCode: true } } } } }, orderBy: { student: { name: "asc" } } },
        },
      },
      attendance: true,
    },
  });
  if (!session) notFound();

  const current = new Map(session.attendance.map((a) => [a.studentId, a.status]));

  return (
    <div className="space-y-6">
      <Link href="/attendance" className="inline-flex items-center gap-1 text-electric text-sm font-semibold"><ChevronLeft size={16} /> Attendance</Link>
      <div>
        <div className="flex items-center gap-2">
          <span className="am-pill bg-electric/10 text-electric">{session.course.code}</span>
          <span className="text-xs text-ink-400">{format(session.scheduledAt, "EEEE d MMM yyyy, HH:mm")}</span>
        </div>
        <h1 className="text-xl font-extrabold text-ink-dark mt-1">{session.topic || session.course.name}</h1>
      </div>

      <form action={saveAttendance}>
        <input type="hidden" name="sessionId" value={session.id} />
        <Card className="!p-0 overflow-hidden">
          {session.course.enrollments.length === 0 ? (
            <p className="p-5 text-sm text-ink-400">No students enrolled in this course yet — enroll them on the course page.</p>
          ) : (
            <table className="w-full">
              <thead className="bg-surface-soft border-b border-border">
                <tr><th className="am-th">Student</th><th className="am-th">Code</th><th className="am-th text-right pr-4">Status</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {session.course.enrollments.map((e) => {
                  const val = current.get(e.student.id) ?? "PRESENT";
                  return (
                    <tr key={e.id}>
                      <td className="am-td font-semibold">{e.student.name}</td>
                      <td className="am-td text-ink-400">{e.student.student?.studentCode}</td>
                      <td className="am-td">
                        <div className="flex gap-1 justify-end">
                          {STATUSES.map((st) => (
                            <label key={st} className="cursor-pointer">
                              <input type="radio" name={`s_${e.student.id}`} value={st} defaultChecked={val === st} className="peer sr-only" />
                              <span className={`am-pill border px-2.5 py-1 peer-checked:text-white ${
                                st === "PRESENT" ? "peer-checked:bg-status-success peer-checked:border-status-success" :
                                st === "LATE" ? "peer-checked:bg-status-warning peer-checked:border-status-warning" :
                                "peer-checked:bg-status-danger peer-checked:border-status-danger"
                              } border-border text-ink-400`}>
                                {st === "PRESENT" ? "Present" : st === "LATE" ? "Late" : "Absent"}
                              </span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
        {session.course.enrollments.length > 0 && (
          <div className="mt-4 flex justify-end">
            <button className="am-btn-primary">Save attendance</button>
          </div>
        )}
      </form>
    </div>
  );
}
