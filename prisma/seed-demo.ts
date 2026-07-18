import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// DEMO seed — populates the school with realistic dummy data so every page
// (Gradebook, Attendance, Calendar, Students, Courses, News, and the home
// dashboard) has something to show. Safe to run repeatedly: it only ever
// touches rows it created itself (demo accounts live on the @demo.aula domain
// and demo courses/events/news are tagged), so a real admin account and any
// real data you enter by hand are left untouched.
//
//   npm run db:seed:demo
//
// Every demo person's password is "demo".
// ─────────────────────────────────────────────────────────────────────────────

// tsx doesn't auto-load .env (only the Prisma CLI does), so fall back to the
// same SQLite file the app uses (prisma/data/community.db under the project root).
const dbUrl = process.env.DATABASE_URL || `file:${path.resolve(process.cwd(), "prisma/data/community.db")}`;
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

const DEMO_DOMAIN = "demo.aula";
const DEMO_TAG = "[demo]"; // marker on events/news so we can clean them up
const YEAR = "2025/26";
const PASSWORD = bcrypt.hashSync("demo", 10);

// Deterministic PRNG so grades/attendance look natural but are stable across runs.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260718);
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const daysFromNow = (d: number, hour = 10, min = 0) => {
  const t = new Date();
  t.setDate(t.getDate() + d);
  t.setHours(hour, min, 0, 0);
  return t;
};

// ── Reference data ────────────────────────────────────────────────────────────
const PROFESSORS = [
  { name: "Dr. Helena Ford", dept: "Finance", title: "Associate Professor" },
  { name: "Dr. Marcus Vale", dept: "Marketing", title: "Professor" },
  { name: "Dr. Priya Nair", dept: "Operations", title: "Senior Lecturer" },
  { name: "Dr. Tomas Brandt", dept: "Strategy", title: "Professor" },
];

const COURSES = [
  { code: "FIN101", name: "Principles of Finance", programme: "MBA", prof: 0 },
  { code: "FIN220", name: "Corporate Valuation", programme: "MSc Finance", prof: 0 },
  { code: "MKT201", name: "Marketing Management", programme: "MBA", prof: 1 },
  { code: "OPS210", name: "Operations & Supply Chain", programme: "MBA", prof: 2 },
  { code: "STR330", name: "Competitive Strategy", programme: "MBA", prof: 3 },
  { code: "DAT150", name: "Data Analysis for Managers", programme: "MSc Finance", prof: 2 },
];

const ASSIGNMENTS = [
  { title: "Assignment 1", weight: 20, dueOffset: -35 },
  { title: "Midterm Exam", weight: 30, dueOffset: -14 },
  { title: "Final Exam", weight: 50, dueOffset: 12 },
];

const FIRST = ["Aya", "Liam", "Sofia", "Noah", "Mia", "Lucas", "Emma", "Ethan", "Olivia", "Diego", "Chloe", "Omar", "Ines", "Kenji", "Laura", "Yusuf", "Nina", "Pablo", "Zara", "Marco", "Elsa", "Hugo", "Amara", "Leo"];
const LAST = ["Costa", "Nguyen", "Rossi", "Meyer", "Haddad", "Silva", "Kowalski", "Tanaka", "Ferrer", "Okafor", "Petrov", "Blum", "Serrano", "Ali", "Novak", "Reyes", "Dubois", "Marín", "Weber", "Santos", "Vidal", "Khan", "Bauer", "Lund"];

const PROGRAMMES = ["MBA", "MSc Finance"];
const GROUPS = ["Group A", "Group B"];

async function main() {
  // Ensure the settings row + a school name exist (create-only, never overwrite).
  await prisma.setting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", schoolName: process.env.SCHOOL_NAME || "Northwind Business School" },
    update: {},
  });

  // ── Clean previous demo data (idempotent) ──────────────────────────────────
  // Courses cascade → assignments/submissions, enrollments, sessions/attendance,
  // materials. Users cascade → their enrollments/submissions/attendance/news.
  await prisma.course.deleteMany({ where: { code: { in: COURSES.map((c) => c.code) } } });
  await prisma.event.deleteMany({ where: { title: { startsWith: DEMO_TAG } } });
  await prisma.news.deleteMany({ where: { title: { startsWith: DEMO_TAG } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `@${DEMO_DOMAIN}` } } });

  // ── Professors ─────────────────────────────────────────────────────────────
  const profs = [];
  for (let i = 0; i < PROFESSORS.length; i++) {
    const p = PROFESSORS[i];
    const email = `${p.name.split(" ").slice(-1)[0].toLowerCase()}@${DEMO_DOMAIN}`;
    const user = await prisma.user.create({
      data: {
        name: p.name,
        email,
        role: "PROFESSOR",
        hashedPassword: PASSWORD,
        professor: { create: { staffCode: `T-${String(i + 1).padStart(3, "0")}`, title: p.title, department: p.dept } },
      },
    });
    profs.push(user);
  }

  // ── Courses ────────────────────────────────────────────────────────────────
  const courses = [];
  for (const c of COURSES) {
    const course = await prisma.course.create({ data: { code: c.code, name: c.name, programme: c.programme } });
    courses.push({ ...course, prof: profs[c.prof] });
  }

  // ── Students ───────────────────────────────────────────────────────────────
  const students = [];
  for (let i = 0; i < 24; i++) {
    const name = `${FIRST[i]} ${LAST[i]}`;
    const email = `${FIRST[i].toLowerCase()}.${LAST[i].toLowerCase().replace(/[^a-z]/g, "")}@${DEMO_DOMAIN}`;
    const programme = PROGRAMMES[i % PROGRAMMES.length];
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: "STUDENT",
        hashedPassword: PASSWORD,
        student: {
          create: {
            studentCode: `S-${String(i + 1).padStart(4, "0")}`,
            programme,
            yearOfStudy: 1 + (i % 2),
            group: GROUPS[i % GROUPS.length],
          },
        },
      },
    });
    // Each student has an innate "ability" that shapes their grades (55–92).
    students.push({ ...user, programme, ability: 55 + Math.floor(rand() * 38) });
  }

  // ── Enrollments (match programme; every course gets a healthy cohort) ────────
  const enrollByCourse = new Map<string, typeof students>();
  for (const course of courses) {
    const cohort = students.filter((s) => s.programme === course.programme);
    // Keep it lively: enroll the whole matching cohort.
    for (const s of cohort) {
      await prisma.enrollment.create({ data: { studentId: s.id, courseId: course.id, academicYear: YEAR } });
    }
    enrollByCourse.set(course.id, cohort);
  }

  // ── Assignments + graded submissions ─────────────────────────────────────────
  let gradedCount = 0;
  for (const course of courses) {
    const cohort = enrollByCourse.get(course.id) ?? [];
    for (let ai = 0; ai < ASSIGNMENTS.length; ai++) {
      const a = ASSIGNMENTS[ai];
      const assignment = await prisma.assignmentDef.create({
        data: { courseId: course.id, title: a.title, weight: a.weight, dueAt: daysFromNow(a.dueOffset) },
      });
      const isFuture = a.dueOffset > 0; // Final Exam not sat yet → leave most ungraded
      for (const s of cohort) {
        // The final exam is still upcoming: ~75% ungraded (PENDING), rest not created.
        if (isFuture && rand() < 0.75) continue;
        const noise = Math.round((rand() - 0.5) * 22);
        const score = clamp(s.ability + noise, 32, 99);
        await prisma.submission.create({
          data: { assignmentId: assignment.id, studentId: s.id, score, status: "GRADED", gradedAt: daysFromNow(a.dueOffset + 3) },
        });
        gradedCount++;
      }
    }
  }

  // ── Class sessions + attendance (6 past + 2 upcoming per course) ─────────────
  let sessionCount = 0;
  for (const course of courses) {
    const cohort = enrollByCourse.get(course.id) ?? [];
    const offsets = [-42, -35, -28, -21, -14, -7, 3, 10];
    for (const off of offsets) {
      const session = await prisma.classSession.create({
        data: {
          courseId: course.id,
          professorId: course.prof.id,
          scheduledAt: daysFromNow(off, 9 + (sessionCount % 6)),
          durationMin: 90,
          room: `Room ${100 + (sessionCount % 8)}`,
          topic: `${course.code} — session ${offsets.indexOf(off) + 1}`,
        },
      });
      sessionCount++;
      if (off < 0) {
        for (const s of cohort) {
          const r = rand();
          const status = r < 0.82 ? "PRESENT" : r < 0.92 ? "LATE" : "ABSENT";
          await prisma.attendance.create({ data: { sessionId: session.id, studentId: s.id, status } });
        }
      }
    }
  }

  // ── Calendar events ──────────────────────────────────────────────────────────
  const events = [
    { title: `${DEMO_TAG} Final Exams — Week 1`, off: 12, kind: "EXAM", location: "Main Hall" },
    { title: `${DEMO_TAG} Guest Lecture: Venture Capital Today`, off: 5, kind: "EVENT", location: "Auditorium B" },
    { title: `${DEMO_TAG} Career Fair`, off: 9, kind: "EVENT", location: "Atrium" },
    { title: `${DEMO_TAG} Faculty Meeting`, off: 2, kind: "MEETING", location: "Room 210" },
    { title: `${DEMO_TAG} Spring Break`, off: 20, kind: "HOLIDAY", location: null },
    { title: `${DEMO_TAG} MBA Cohort Orientation`, off: -30, kind: "EVENT", location: "Auditorium A" },
  ];
  for (const e of events) {
    await prisma.event.create({
      data: { title: e.title, startsAt: daysFromNow(e.off, 11), endsAt: daysFromNow(e.off, 13), kind: e.kind, location: e.location },
    });
  }

  // ── News announcements ────────────────────────────────────────────────────────
  const news = [
    { title: `${DEMO_TAG} Welcome to the Spring semester`, body: "Classes begin Monday. Check your course pages for reading lists and the first week's materials." },
    { title: `${DEMO_TAG} Midterm grades published`, body: "Midterm results are now available in the gradebook. Speak to your instructor during office hours with any questions." },
    { title: `${DEMO_TAG} Library extended hours during exams`, body: "The library will stay open until midnight for the two weeks leading up to final exams." },
  ];
  for (let i = 0; i < news.length; i++) {
    await prisma.news.create({ data: { title: news[i].title, body: news[i].body, authorId: profs[i % profs.length].id } });
  }

  console.log("\n────────────────────────────────────────────");
  console.log("  Aula Magna Community — DEMO data loaded");
  console.log(`  Professors:   ${profs.length}`);
  console.log(`  Students:     ${students.length}`);
  console.log(`  Courses:      ${courses.length}`);
  console.log(`  Sessions:     ${sessionCount}`);
  console.log(`  Grades:       ${gradedCount} graded submissions`);
  console.log("  ────────────────────────────────────────");
  console.log("  Sign in as a professor:  ford@demo.aula / demo");
  console.log("  Sign in as a student:    aya.costa@demo.aula / demo");
  console.log("────────────────────────────────────────────\n");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
