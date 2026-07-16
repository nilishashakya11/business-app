import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireAuth, assertBranchAccess, audit, ApiError } from "@/lib/api-auth";
import { appointmentSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/rbac";

export const PATCH = handle(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const ctx = await requireAuth();
    if (!ctx.permissions.includes(PERMISSIONS.APPOINTMENT_UPDATE)) {
      throw new ApiError(403, "Forbidden");
    }
    const { id } = await params;
    const data = appointmentSchema.partial().parse(await req.json());

    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { branchId: true, startTime: true, endTime: true, staffId: true },
    });
    if (!existing) throw new ApiError(404, "Appointment not found");
    assertBranchAccess(ctx, existing.branchId);

    let startTime = existing.startTime;
    let endTime = existing.endTime;
    let serviceRewrite: { serviceId: string; priceAtBooking: unknown; durationMinutes: number }[] | null =
      null;

    // Recompute timing if the services or start time changed.
    if (data.serviceIds) {
      const services = await prisma.service.findMany({
        where: { id: { in: data.serviceIds }, branchId: existing.branchId },
        select: { id: true, durationMinutes: true, price: true },
      });
      if (services.length !== data.serviceIds.length) {
        throw new ApiError(400, "One or more services are invalid for this branch");
      }
      const totalMinutes = services.reduce((sum, s) => sum + s.durationMinutes, 0);
      startTime = data.startTime ? new Date(data.startTime) : existing.startTime;
      endTime = new Date(startTime.getTime() + totalMinutes * 60_000);
      serviceRewrite = services.map((s) => ({
        serviceId: s.id,
        priceAtBooking: s.price,
        durationMinutes: s.durationMinutes,
      }));
    } else if (data.startTime) {
      const durationMs = existing.endTime.getTime() - existing.startTime.getTime();
      startTime = new Date(data.startTime);
      endTime = new Date(startTime.getTime() + durationMs);
    }

    const staffId = data.staffId !== undefined ? data.staffId : existing.staffId;

    // Re-check double-booking when timing or staff changed.
    if (staffId && (data.startTime || data.serviceIds || data.staffId !== undefined)) {
      const clash = await prisma.appointment.findFirst({
        where: {
          id: { not: id },
          staffId,
          status: { notIn: ["CANCELLED", "NO_SHOW"] },
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        select: { id: true },
      });
      if (clash) throw new ApiError(409, "This staff member already has an appointment in that slot");
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(data.customerId !== undefined && { customerId: data.customerId || null }),
        ...(data.staffId !== undefined && { staffId: data.staffId || null }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
        startTime,
        endTime,
        ...(serviceRewrite
          ? {
              services: {
                deleteMany: {},
                create: serviceRewrite as never,
              },
            }
          : {}),
      },
    });

    await audit(ctx, "appointment.updated", "Appointment", id);
    return NextResponse.json({ appointment });
  },
);

export const DELETE = handle(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const ctx = await requireAuth();
    if (!ctx.permissions.includes(PERMISSIONS.APPOINTMENT_DELETE)) {
      throw new ApiError(403, "Forbidden");
    }
    const { id } = await params;

    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { branchId: true },
    });
    if (!existing) throw new ApiError(404, "Appointment not found");
    assertBranchAccess(ctx, existing.branchId);

    await prisma.appointment.delete({ where: { id } });
    await audit(ctx, "appointment.deleted", "Appointment", id);
    return NextResponse.json({ ok: true });
  },
);
