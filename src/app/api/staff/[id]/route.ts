import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requirePermission, assertBranchAccess, audit, ApiError } from "@/lib/api-auth";
import { PERMISSIONS } from "@/lib/rbac";
import { Role } from "@prisma/client";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  commissionRate: z.coerce.number().min(0).max(100).optional(),
  color: z.string().optional(),
  role: z.enum(["ADMIN", "MANAGER", "TEAM_MEMBER"]).optional(),
  isActive: z.boolean().optional(),
});

export const PATCH = handle(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const ctx = await requirePermission(PERMISSIONS.STAFF_MANAGE);
    const { id } = await params;
    const data = updateSchema.parse(await req.json());

    const staff = await prisma.staff.findUnique({ where: { id }, select: { userId: true, branchId: true } });
    if (!staff) throw new ApiError(404, "Staff member not found");
    assertBranchAccess(ctx, staff.branchId);

    await prisma.$transaction([
      prisma.staff.update({
        where: { id },
        data: {
          ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle || null }),
          ...(data.commissionRate !== undefined && { commissionRate: data.commissionRate }),
          ...(data.color !== undefined && { color: data.color || null }),
        },
      }),
      prisma.user.update({
        where: { id: staff.userId },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.phone !== undefined && { phone: data.phone || null }),
          ...(data.role !== undefined && { role: data.role as Role }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      }),
    ]);

    await audit(ctx, "staff.updated", "Staff", id);
    return NextResponse.json({ ok: true });
  },
);

export const DELETE = handle(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const ctx = await requirePermission(PERMISSIONS.STAFF_MANAGE);
    const { id } = await params;

    const staff = await prisma.staff.findUnique({ where: { id }, select: { userId: true, branchId: true } });
    if (!staff) throw new ApiError(404, "Staff member not found");
    assertBranchAccess(ctx, staff.branchId);

    // Deactivate rather than delete to keep appointment/commission history intact.
    await prisma.user.update({ where: { id: staff.userId }, data: { isActive: false } });
    await audit(ctx, "staff.deactivated", "Staff", id);
    return NextResponse.json({ ok: true });
  },
);
