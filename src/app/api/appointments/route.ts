import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireAuth, assertBranchAccess, audit, ApiError } from "@/lib/api-auth";
import { appointmentSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/rbac";

export const GET = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  const canViewAll = ctx.permissions.includes(PERMISSIONS.APPOINTMENT_VIEW);
  const canViewOwn = ctx.permissions.includes(PERMISSIONS.APPOINTMENT_VIEW_OWN);
  if (!canViewAll && !canViewOwn) throw new ApiError(403, "Forbidden");

  const params = req.nextUrl.searchParams;
  const branchId = params.get("branchId");
  const from = params.get("from");
  const to = params.get("to");
  if (!branchId) throw new ApiError(400, "branchId is required");
  assertBranchAccess(ctx, branchId);

  // Team members without full view see only their own bookings.
  let staffFilter: string | undefined;
  if (!canViewAll && canViewOwn) {
    const me = await prisma.staff.findFirst({ where: { userId: ctx.userId }, select: { id: true } });
    staffFilter = me?.id ?? "__none__";
  }

  const appointments = await prisma.appointment.findMany({
    where: {
      branchId,
      ...(staffFilter ? { staffId: staffFilter } : {}),
      ...(from && to ? { startTime: { gte: new Date(from), lte: new Date(to) } } : {}),
    },
    orderBy: { startTime: "asc" },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      staff: { include: { user: { select: { name: true } } } },
      services: { include: { service: { select: { name: true } } } },
    },
  });

  return NextResponse.json({ appointments });
});

export const POST = handle(async (req: NextRequest) => {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.APPOINTMENT_CREATE)) {
    throw new ApiError(403, "Forbidden");
  }
  const data = appointmentSchema.parse(await req.json());
  assertBranchAccess(ctx, data.branchId);

  // Load services to compute duration and lock in prices at booking time.
  const services = await prisma.service.findMany({
    where: { id: { in: data.serviceIds }, branchId: data.branchId },
    select: { id: true, durationMinutes: true, price: true },
  });
  if (services.length !== data.serviceIds.length) {
    throw new ApiError(400, "One or more services are invalid for this branch");
  }

  const totalMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
  const startTime = new Date(data.startTime);
  const endTime = new Date(startTime.getTime() + totalMinutes * 60_000);

  // Guard against double-booking the same staff member.
  if (data.staffId) {
    const clash = await prisma.appointment.findFirst({
      where: {
        staffId: data.staffId,
        status: { notIn: ["CANCELLED", "NO_SHOW"] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
      select: { id: true },
    });
    if (clash) throw new ApiError(409, "This staff member already has an appointment in that slot");
  }

  const appointment = await prisma.appointment.create({
    data: {
      branchId: data.branchId,
      customerId: data.customerId || null,
      staffId: data.staffId || null,
      status: data.status,
      startTime,
      endTime,
      notes: data.notes || null,
      isOnline: data.isOnline,
      services: {
        create: services.map((s) => ({
          serviceId: s.id,
          priceAtBooking: s.price,
          durationMinutes: s.durationMinutes,
        })),
      },
    },
    include: { services: true },
  });

  await audit(ctx, "appointment.created", "Appointment", appointment.id);
  return NextResponse.json({ appointment }, { status: 201 });
});
