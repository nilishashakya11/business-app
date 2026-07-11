import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requirePermission, assertBranchAccess, audit, ApiError } from "@/lib/api-auth";
import { serviceSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/rbac";

export const PATCH = handle(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const ctx = await requirePermission(PERMISSIONS.SERVICE_MANAGE);
    const { id } = await params;
    const data = serviceSchema.partial().parse(await req.json());

    const existing = await prisma.service.findUnique({ where: { id }, select: { branchId: true } });
    if (!existing) throw new ApiError(404, "Service not found");
    assertBranchAccess(ctx, existing.branchId);

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(data.categoryId !== undefined && { categoryId: data.categoryId || null }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.durationMinutes !== undefined && { durationMinutes: data.durationMinutes }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.taxRate !== undefined && { taxRate: data.taxRate }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    await audit(ctx, "service.updated", "Service", id);
    return NextResponse.json({ service });
  },
);

export const DELETE = handle(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const ctx = await requirePermission(PERMISSIONS.SERVICE_MANAGE);
    const { id } = await params;

    const existing = await prisma.service.findUnique({ where: { id }, select: { branchId: true } });
    if (!existing) throw new ApiError(404, "Service not found");
    assertBranchAccess(ctx, existing.branchId);

    // Soft-delete to preserve historical invoice/appointment references.
    await prisma.service.update({ where: { id }, data: { isActive: false } });
    await audit(ctx, "service.archived", "Service", id);
    return NextResponse.json({ ok: true });
  },
);
