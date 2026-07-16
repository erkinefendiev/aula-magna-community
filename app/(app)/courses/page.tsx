import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser, isStaff } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { addCourse } from "./actions";
import { ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CoursesPage() {
  const user = await requireUser();
  const staff = isStaff(user.role);

  const courses = await prisma.course.findMany({
    orderBy: { code: "asc" },
    include: { _count: { select: { enrollments: true, materials: true } } },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Courses" subtitle={`${courses.length} course${courses.length === 1 ? "" : "s"}`} />

      {staff && (
        <Card>
          <h2 className="text-sm font-bold text-ink-dark mb-3">Add a course</h2>
          <form action={addCourse} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div><label className="am-label">Code</label><input name="code" required className="am-input" placeholder="MK101" /></div>
            <div className="lg:col-span-2"><label className="am-label">Name</label><input name="name" required className="am-input" placeholder="Marketing Foundations" /></div>
            <div><label className="am-label">Programme</label><input name="programme" className="am-input" placeholder="BBA" /></div>
            <button className="am-btn-primary">Add course</button>
          </form>
        </Card>
      )}

      {courses.length === 0 ? (
        <EmptyState title="No courses yet" hint={staff ? "Add your first course above." : "Your school hasn't added courses yet."} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {courses.map((c) => (
            <Link key={c.id} href={`/courses/${c.id}`} className="am-card p-4 hover:border-electric/40 transition group">
              <div className="flex items-center justify-between">
                <span className="am-pill bg-electric/10 text-electric">{c.code}</span>
                <ArrowRight size={15} className="text-ink-400 group-hover:text-electric transition" />
              </div>
              <div className="mt-2 font-bold text-ink-dark">{c.name}</div>
              <div className="text-xs text-ink-400 mt-1">{c.programme || "—"}</div>
              <div className="text-[11px] text-ink-400 mt-3">
                {c._count.enrollments} students · {c._count.materials} materials
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
