import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

// First-run seed: create the school settings row + a single ADMIN account so the
// school can sign in. Idempotent — safe to run again; it never wipes data and
// only creates the admin if no users exist yet. Real records are entered in-app.

const prisma = new PrismaClient();

async function main() {
  await prisma.setting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", schoolName: process.env.SCHOOL_NAME || "Your School" },
    update: {},
  });

  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const email = (process.env.ADMIN_EMAIL || "admin@school.edu").toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "admin";
    await prisma.user.create({
      data: {
        name: process.env.ADMIN_NAME || "School Admin",
        email,
        role: "ADMIN",
        hashedPassword: bcrypt.hashSync(password, 10),
      },
    });
    console.log("\n────────────────────────────────────────────");
    console.log("  Aula Magna Community — admin account created");
    console.log(`  Sign in:   ${email}`);
    console.log(`  Password:  ${password}`);
    console.log("  ⚠  Change this password after first sign-in.");
    console.log("────────────────────────────────────────────\n");
  } else {
    console.log("Users already exist — skipped admin creation.");
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
