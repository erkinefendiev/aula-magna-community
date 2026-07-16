import { prisma } from "@/lib/db";
import { requireUser, isStaff } from "@/lib/auth";
import { PageHeader, Card, EmptyState } from "@/components/ui";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

async function addEvent(formData: FormData) {
  "use server";
  await requireRole("ADMIN", "PROFESSOR");
  const title = String(formData.get("title") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const kind = String(formData.get("kind") ?? "EVENT");
  const location = String(formData.get("location") ?? "").trim() || null;
  if (!title || !startsAt) return;
  await prisma.event.create({ data: { title, startsAt: new Date(startsAt), kind, location } });
  revalidatePath("/calendar");
}

export default async function CalendarPage() {
  const user = await requireUser();
  const staff = isStaff(user.role);
  const events = await prisma.event.findMany({ orderBy: { startsAt: "asc" } });
  const now = new Date();
  const upcoming = events.filter((e) => e.startsAt >= now);
  const past = events.filter((e) => e.startsAt < now).reverse();

  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" subtitle="Events, exams and holidays for the whole school." />

      {staff && (
        <Card>
          <h2 className="text-sm font-bold text-ink-dark mb-3">Add to the calendar</h2>
          <form action={addEvent} className="grid sm:grid-cols-4 gap-3 items-end">
            <div className="sm:col-span-2"><label className="am-label">Title</label><input name="title" required className="am-input" placeholder="Midterm exams" /></div>
            <div><label className="am-label">When</label><input name="startsAt" type="datetime-local" required className="am-input" /></div>
            <div>
              <label className="am-label">Kind</label>
              <select name="kind" className="am-input"><option value="EVENT">Event</option><option value="EXAM">Exam</option><option value="HOLIDAY">Holiday</option><option value="MEETING">Meeting</option></select>
            </div>
            <div className="sm:col-span-3"><label className="am-label">Location (optional)</label><input name="location" className="am-input" placeholder="Main hall" /></div>
            <button className="am-btn-primary">Add</button>
          </form>
        </Card>
      )}

      {events.length === 0 ? (
        <EmptyState title="Nothing on the calendar yet" />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <h2 className="text-sm font-bold text-ink-dark mb-3">Upcoming</h2>
            {upcoming.length === 0 ? <p className="text-sm text-ink-400">Nothing upcoming.</p> : (
              <ul className="divide-y divide-border">
                {upcoming.map((e) => (
                  <li key={e.id} className="py-2.5 flex items-center justify-between gap-3">
                    <div><div className="text-sm font-semibold text-ink-dark">{e.title}</div><div className="text-[11px] text-ink-400">{e.kind.toLowerCase()}{e.location ? ` · ${e.location}` : ""}</div></div>
                    <span className="text-xs text-ink-400 shrink-0">{format(e.startsAt, "d MMM, HH:mm")}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card>
            <h2 className="text-sm font-bold text-ink-dark mb-3">Past</h2>
            {past.length === 0 ? <p className="text-sm text-ink-400">Nothing past.</p> : (
              <ul className="divide-y divide-border">
                {past.slice(0, 20).map((e) => (
                  <li key={e.id} className="py-2.5 flex items-center justify-between gap-3 opacity-70">
                    <span className="text-sm font-semibold text-ink-dark">{e.title}</span>
                    <span className="text-xs text-ink-400 shrink-0">{format(e.startsAt, "d MMM")}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
