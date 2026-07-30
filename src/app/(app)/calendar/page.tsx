import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { PageHeader } from "@/components/shell/page-header";
import { toDateInput, startOfWeek } from "@/lib/utils";
import { CalendarClient, type CalendarAppointment, type CalendarStaff } from "./calendar-client";

export const metadata = { title: "Calendar — Glow & Go" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; view?: string }>;
}) {
  const ctx = await requireAuth();
  const canViewAll = ctx.permissions.includes(PERMISSIONS.APPOINTMENT_VIEW);
  const canViewOwn = ctx.permissions.includes(PERMISSIONS.APPOINTMENT_VIEW_OWN);
  if (!canViewAll && !canViewOwn) redirect("/dashboard");

  const { branchId } = await resolveActiveBranch(ctx);
  const sp = await searchParams;
  const date = sp.date;
  const view = sp.view === "week" ? "week" : "day";

  // Default to today; normalise to the local window (day or week).
  const dayStr = date ?? toDateInput(new Date());
  const anchor = new Date(dayStr + "T00:00:00");
  const from = view === "day" ? anchor : startOfWeek(anchor);
  const to = view === "day" ? new Date(dayStr + "T23:59:59.999") : new Date(from.getTime() + 7 * 86_400_000 - 1);

  // Team members without full view see only their own bookings.
  let staffFilter: string | undefined;
  if (branchId && !canViewAll && canViewOwn) {
    const me = await prisma.staff.findFirst({
      where: { userId: ctx.userId, branchId },
      select: { id: true },
    });
    staffFilter = me?.id ?? "__none__";
  }

  const [staff, appointments] = await Promise.all([
    branchId
      ? prisma.staff.findMany({
          where: { branchId, user: { isActive: true } },
          orderBy: { user: { name: "asc" } },
          select: { id: true, color: true, user: { select: { name: true } } },
        })
      : Promise.resolve([]),
    branchId
      ? prisma.appointment.findMany({
          where: {
            branchId,
            startTime: { gte: from, lte: to },
            ...(staffFilter ? { staffId: staffFilter } : {}),
          },
          orderBy: { startTime: "asc" },
          include: {
            customer: { select: { firstName: true, lastName: true } },
            staff: { select: { color: true, user: { select: { name: true } } } },
            services: { include: { service: { select: { name: true } } } },
          },
        })
      : Promise.resolve([]),
  ]);

  const staffList: CalendarStaff[] = staff.map((s) => ({
    id: s.id,
    name: s.user.name,
    color: s.color,
  }));

  const list: CalendarAppointment[] = appointments.map((a) => ({
    id: a.id,
    customerId: a.customerId,
    staffId: a.staffId,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    status: a.status,
    customerName: a.customer
      ? `${a.customer.firstName} ${a.customer.lastName ?? ""}`.trim()
      : "Walk-in",
    staffName: a.staff?.user.name ?? null,
    staffColor: a.staff?.color ?? null,
    serviceNames: a.services.map((s) => s.service.name),
  }));

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Each team member's day, side by side."
      />
      <CalendarClient
        date={dayStr}
        initialAppointments={list}
        staff={staffList}
        branchId={branchId}
        canCreate={ctx.permissions.includes(PERMISSIONS.APPOINTMENT_CREATE)}
        canUpdate={ctx.permissions.includes(PERMISSIONS.APPOINTMENT_UPDATE)}
      />
    </div>
  );
}
