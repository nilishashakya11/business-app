import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, ApiError } from "@/lib/api-auth";

/**
 * GET /api/availability?branchId&staffId&date=YYYY-MM-DD&duration=minutes
 * Returns bookable start times (ISO strings) for a staff member on a day,
 * derived from their working hours minus existing appointments. Public.
 */
export const GET = handle(async (req: NextRequest) => {
  const p = req.nextUrl.searchParams;
  const branchId = p.get("branchId");
  const staffId = p.get("staffId");
  const date = p.get("date");
  const duration = Math.max(5, Number(p.get("duration") ?? "30"));
  if (!branchId || !staffId || !date) {
    throw new ApiError(400, "branchId, staffId and date are required");
  }

  const dayStart = new Date(date + "T00:00:00");
  if (Number.isNaN(dayStart.getTime())) throw new ApiError(400, "Invalid date");
  const dayEnd = new Date(date + "T23:59:59.999");
  const dow = dayStart.getDay(); // 0=Sun..6=Sat

  const staff = await prisma.staff.findFirst({
    where: { id: staffId, branchId, isBookable: true },
    select: {
      workingHours: { where: { dayOfWeek: dow }, select: { startTime: true, endTime: true, isOff: true } },
    },
  });
  if (!staff) throw new ApiError(400, "Team member unavailable");

  const wh = staff.workingHours[0];
  if (!wh || wh.isOff) return NextResponse.json({ slots: [] });

  const [sh, sm] = wh.startTime.split(":").map(Number);
  const [eh, em] = wh.endTime.split(":").map(Number);
  const open = new Date(dayStart);
  open.setHours(sh, sm, 0, 0);
  const close = new Date(dayStart);
  close.setHours(eh, em, 0, 0);

  const existing = await prisma.appointment.findMany({
    where: {
      staffId,
      status: { notIn: ["CANCELLED", "NO_SHOW"] },
      startTime: { lt: dayEnd },
      endTime: { gt: dayStart },
    },
    select: { startTime: true, endTime: true },
  });

  const STEP = 15; // minutes between candidate slots
  const now = Date.now();
  const slots: string[] = [];

  for (let t = new Date(open); t.getTime() + duration * 60_000 <= close.getTime(); t = new Date(t.getTime() + STEP * 60_000)) {
    const slotStart = t.getTime();
    const slotEnd = slotStart + duration * 60_000;
    if (slotStart < now) continue; // no past slots
    const overlaps = existing.some(
      (a) => a.startTime.getTime() < slotEnd && a.endTime.getTime() > slotStart,
    );
    if (!overlaps) slots.push(new Date(slotStart).toISOString());
  }

  return NextResponse.json({ slots });
});
