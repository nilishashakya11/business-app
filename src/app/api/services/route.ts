import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requirePermission, assertBranchAccess, audit } from "@/lib/api-auth";
import { serviceSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/rbac";

export const GET = handle(async (req: NextRequest) => {
  await requirePermission(PERMISSIONS.SERVICE_VIEW);
  const branchId = req.nextUrl.searchParams.get("branchId");

  const services = await prisma.service.findMany({
    where: { ...(branchId ? { branchId } : {}) },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
    include: { category: true },
  });

  return NextResponse.json({ services });
});

export const POST = handle(async (req: NextRequest) => {
  const ctx = await requirePermission(PERMISSIONS.SERVICE_MANAGE);
  const data = serviceSchema.parse(await req.json());
  assertBranchAccess(ctx, data.branchId);

  const service = await prisma.service.create({
    data: {
      branchId: data.branchId,
      categoryId: data.categoryId || null,
      name: data.name,
      description: data.description || null,
      durationMinutes: data.durationMinutes,
      price: data.price,
      taxRate: data.taxRate,
      isActive: data.isActive,
    },
  });

  await audit(ctx, "service.created", "Service", service.id);
  return NextResponse.json({ service }, { status: 201 });
});
