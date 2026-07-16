import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { addStudent, deleteStudent } from "./actions";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StudentsPage() {
  const me = await requireRole("ADMIN", "PROFESSOR");
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    include: { student: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Students" subtitle={`${students.length} enrolled`} />

      <Card>
        <h2 className="text-sm font-bold text-ink-dark mb-3">Add a student</h2>
        <form action={addStudent} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 items-end">
          <div><label className="am-label">Full name</label><input name="name" required className="am-input" placeholder="Jane Doe" /></div>
          <div><label className="am-label">Email</label><input name="email" type="email" required className="am-input" placeholder="jane@school.edu" /></div>
          <div><label className="am-label">Student code</label><input name="studentCode" required className="am-input" placeholder="S-001" /></div>
          <div><label className="am-label">Programme</label><input name="programme" className="am-input" placeholder="BBA" /></div>
          <div><label className="am-label">Group</label><input name="group" className="am-input" placeholder="A1" /></div>
          <button className="am-btn-primary">Add student</button>
        </form>
        <p className="text-[11px] text-ink-400 mt-2">The student signs in with their email and, initially, their student code as the password.</p>
      </Card>

      {students.length === 0 ? (
        <EmptyState title="No students yet" hint="Add your first student above." />
      ) : (
        <Card className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-soft border-b border-border">
                <tr>
                  <th className="am-th">Name</th>
                  <th className="am-th">Code</th>
                  <th className="am-th">Programme</th>
                  <th className="am-th">Group</th>
                  <th className="am-th">Email</th>
                  {me.role === "ADMIN" && <th className="am-th"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="am-td font-semibold">{s.name}</td>
                    <td className="am-td">{s.student?.studentCode}</td>
                    <td className="am-td">{s.student?.programme || "—"}</td>
                    <td className="am-td">{s.student?.group || "—"}</td>
                    <td className="am-td text-ink-400">{s.email}</td>
                    {me.role === "ADMIN" && (
                      <td className="am-td text-right">
                        <form action={deleteStudent}>
                          <input type="hidden" name="id" value={s.id} />
                          <button className="text-status-danger hover:opacity-70" title="Remove" aria-label="Remove student"><Trash2 size={15} /></button>
                        </form>
                      </td>
                    )}
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
