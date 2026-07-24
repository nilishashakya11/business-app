import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { PageHeader } from "@/components/shell/page-header";
import { toDateInput } from "@/lib/utils";
import { CalendarClient, type CalendarAppointment } from "./calendar-client";

export const metadata = { title: "Calendar — Glow & Go" };

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const ctx = await requireAuth();
  const canViewAll = ctx.permissions.includes(PERMISSIONS.APPOINTMENT_VIEW);
  const canViewOwn = ctx.permissions.includes(PERMISSIONS.APPOINTMENT_VIEW_OWN);
  if (!canViewAll && !canViewOwn) redirect("/dashboard");

  const { branchId } = await resolveActiveBranch(ctx);
  const { date } = await searchParams;

  // Default to today; normalise to the local day window.
  const dayStr = date ?? toDateInput(new Date());
  const dayStart = new Date(dayStr + "T00:00:00");
  const dayEnd = new Date(dayStr + "T23:59:59.999");

  // Team members without full view see only their own bookings.
  let staffFilter: string | undefined;
  if (branchId && !canViewAll && canViewOwn) {
    const me = await prisma.staff.findFirst({
      where: { userId: ctx.userId, branchId },
      select: { id: true },
    });
    staffFilter = me?.id ?? "__none__";
  }

  const appointments = branchId
    ? await prisma.appointment.findMany({
        where: {
          branchId,
          startTime: { gte: dayStart, lte: dayEnd },
          ...(staffFilter ? { staffId: staffFilter } : {}),
        },
        orderBy: { startTime: "asc" },
        include: {
          customer: { select: { firstName: true, lastName: true } },
          staff: { select: { color: true, user: { select: { name: true } } } },
          services: { include: { service: { select: { name: true } } } },
        },
      })
    : [];

  const list: CalendarAppointment[] = appointments.map((a) => ({
    id: a.id,
    customerId: a.customerId,
    staffId: a.staffId,
    startTime: a.startTime.toISOString(),
    endTime: a.endTime.toISOString(),
    status: a.status,
    notes: a.notes,
    customerName: a.customer
      ? `${a.customer.firstName} ${a.customer.lastName ?? ""}`.trim()
      : "Walk-in",
    staffName: a.staff?.user.name ?? null,
    staffColor: a.staff?.color ?? null,
    serviceNames: a.services.map((s) => s.service.name),
    serviceIds: a.services.map((s) => s.serviceId),
  }));

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Day view of appointments for this branch."
      />
      <CalendarClient
        date={dayStr}
        appointments={list}
        branchId={branchId}
        canCreate={ctx.permissions.includes(PERMISSIONS.APPOINTMENT_CREATE)}
      />
    </div>
  );
}
