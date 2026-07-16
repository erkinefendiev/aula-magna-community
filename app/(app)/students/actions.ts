"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export async function addStudent(formData: FormData) {
  await requireRole("ADMIN", "PROFESSOR");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const studentCode = String(formData.get("studentCode") ?? "").trim();
  const programme = String(formData.get("programme") ?? "").trim();
  const group = String(formData.get("group") ?? "").trim() || null;
  if (!name || !email || !studentCode) return;

  // Temp password = the student code, so the admin can hand it out simply.
  const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (exists) return;

  await prisma.user.create({
    data: {
      name,
      email,
      role: "STUDENT",
      hashedPassword: hashPassword(studentCode),
      student: { create: { studentCode, programme, group } },
    },
  });
  revalidatePath("/students");
}

export async function deleteStudent(formData: FormData) {
  await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (id) await prisma.user.delete({ where: { id } }).catch(() => {});
  revalidatePath("/students");
}
