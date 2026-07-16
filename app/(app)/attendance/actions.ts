"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

export async function createSession(formData: FormData) {
  await requireRole("ADMIN", "PROFESSOR");
  const courseId = String(formData.get("courseId") ?? "");
  const dateRaw = String(formData.get("scheduledAt") ?? "").trim();
  const topic = String(formData.get("topic") ?? "").trim() || null;
  const room = String(formData.get("room") ?? "").trim() || null;
  if (!courseId || !dateRaw) return;
  const s = await prisma.classSession.create({
    data: { courseId, scheduledAt: new Date(dateRaw), topic, room },
  });
  redirect(`/attendance/${s.id}`);
}

// Bulk-save attendance for a session: a status per enrolled student.
export async function saveAttendance(formData: FormData) {
  await requireRole("ADMIN", "PROFESSOR");
  const sessionId = String(formData.get("sessionId") ?? "");
  if (!sessionId) return;

  const session = await prisma.classSession.findUnique({
    where: { id: sessionId },
    include: { course: { include: { enrollments: { select: { studentId: true } } } } },
  });
  if (!session) return;

  for (const e of session.course.enrollments) {
    const status = String(formData.get(`s_${e.studentId}`) ?? "PRESENT");
    await prisma.attendance.upsert({
      where: { sessionId_studentId: { sessionId, studentId: e.studentId } },
      create: { sessionId, studentId: e.studentId, status },
      update: { status, markedAt: new Date() },
    });
  }
  revalidatePath(`/attendance/${sessionId}`);
  revalidatePath("/attendance");
}
