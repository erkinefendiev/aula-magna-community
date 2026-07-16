"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

// Bulk-save scores for one assignment. Blank score = leave/remove.
export async function saveGrades(formData: FormData) {
  await requireRole("ADMIN", "PROFESSOR");
  const assignmentId = String(formData.get("assignmentId") ?? "");
  if (!assignmentId) return;

  const assignment = await prisma.assignmentDef.findUnique({
    where: { id: assignmentId },
    include: { course: { include: { enrollments: { select: { studentId: true } } } } },
  });
  if (!assignment) return;

  for (const e of assignment.course.enrollments) {
    const raw = String(formData.get(`g_${e.studentId}`) ?? "").trim();
    if (raw === "") {
      await prisma.submission.deleteMany({ where: { assignmentId, studentId: e.studentId } });
      continue;
    }
    const score = Math.max(0, Math.min(100, parseInt(raw, 10) || 0));
    await prisma.submission.upsert({
      where: { assignmentId_studentId: { assignmentId, studentId: e.studentId } },
      create: { assignmentId, studentId: e.studentId, score, status: "GRADED", gradedAt: new Date() },
      update: { score, status: "GRADED", gradedAt: new Date() },
    });
  }
  revalidatePath(`/gradebook`);
}
