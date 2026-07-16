import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireAuth, assertBranchAccess, audit, ApiError } from "@/lib/api-auth";
import { appointmentStatusSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/rbac";

export const PATCH = handle(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const ctx = await requireAuth();
    if (!ctx.permissions.includes(PERMISSIONS.APPOINTMENT_UPDATE_STATUS)) {
      throw new ApiError(403, "Forbidden");
    }
    const { id } = await params;
    const { status } = appointmentStatusSchema.parse(await req.json());

    const existing = await prisma.appointment.findUnique({
      where: { id },
      select: { branchId: true, staffId: true },
    });
    if (!existing) throw new ApiError(404, "Appointment not found");
    assertBranchAccess(ctx, existing.branchId);

    // Team members may only touch their own appointments.
    if (!ctx.permissions.includes(PERMISSIONS.APPOINTMENT_UPDATE)) {
      const me = await prisma.staff.findFirst({
        where: { userId: ctx.userId },
        select: { id: true },
      });
      if (!me || me.id !== existing.staffId) {
        throw new ApiError(403, "You can only update your own appointments");
      }
    }

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
    });

    await audit(ctx, "appointment.status_changed", "Appointment", id, { status });
    return NextResponse.json({ appointment });
  },
);
