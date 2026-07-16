"use server";

import { redirect } from "next/navigation";
import { destroySession } from "@/lib/session";

export async function signOut() {
  await destroySession();
  redirect("/login");
}
