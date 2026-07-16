"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";

const AY = String(new Date().getFullYear()) + "-" + String(new Date().getFullYear() + 1);

export async function addCourse(formData: FormData) {
  await requireRole("ADMIN", "PROFESSOR");
  const code = String(formData.get("code") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const programme = String(formData.get("programme") ?? "").trim();
  if (!code || !name) return;
  const clash = await prisma.course.findUnique({ where: { code }, select: { id: true } });
  if (clash) return;
  await prisma.course.create({ data: { code, name, programme } });
  revalidatePath("/courses");
}

export async function addMaterial(formData: FormData) {
  await requireRole("ADMIN", "PROFESSOR");
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const kind = String(formData.get("kind") ?? "LINK");
  const week = Math.max(1, parseInt(String(formData.get("week") ?? "1"), 10) || 1);
  const url = String(formData.get("url") ?? "").trim() || null;
  if (!courseId || !title) return;
  await prisma.material.create({ data: { courseId, title, kind, week, url } });
  revalidatePath(`/courses/${courseId}`);
}

export async function enrollStudent(formData: FormData) {
  await requireRole("ADMIN", "PROFESSOR");
  const courseId = String(formData.get("courseId") ?? "");
  const studentId = String(formData.get("studentId") ?? "");
  if (!courseId || !studentId) return;
  await prisma.enrollment.upsert({
    where: { studentId_courseId_academicYear: { studentId, courseId, academicYear: AY } },
    create: { studentId, courseId, academicYear: AY },
    update: {},
  });
  revalidatePath(`/courses/${courseId}`);
}

export async function unenrollStudent(formData: FormData) {
  await requireRole("ADMIN", "PROFESSOR");
  const id = String(formData.get("enrollmentId") ?? "");
  const courseId = String(formData.get("courseId") ?? "");
  if (id) await prisma.enrollment.delete({ where: { id } }).catch(() => {});
  revalidatePath(`/courses/${courseId}`);
}

export async function addAssignment(formData: FormData) {
  await requireRole("ADMIN", "PROFESSOR");
  const courseId = String(formData.get("courseId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const weight = Math.max(0, parseInt(String(formData.get("weight") ?? "0"), 10) || 0);
  const dueRaw = String(formData.get("dueAt") ?? "").trim();
  if (!courseId || !title) return;
  await prisma.assignmentDef.create({
    data: { courseId, title, weight, dueAt: dueRaw ? new Date(dueRaw) : null },
  });
  revalidatePath(`/courses/${courseId}`);
}
