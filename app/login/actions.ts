"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { createSession } from "@/lib/session";

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect("/login?error=1");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.hashedPassword)) {
    redirect("/login?error=1");
  }
  await createSession(user.id, user.role);
  redirect("/");
}
