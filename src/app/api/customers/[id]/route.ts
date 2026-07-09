import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requirePermission, audit, ApiError } from "@/lib/api-auth";
import { customerSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/rbac";

export const GET = handle(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    await requirePermission(PERMISSIONS.CUSTOMER_VIEW);
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        appointments: {
          orderBy: { startTime: "desc" },
          take: 10,
          include: { services: { include: { service: true } }, staff: { include: { user: true } } },
        },
        invoices: { orderBy: { issuedAt: "desc" }, take: 10 },
        memberships: { include: { plan: true } },
      },
    });
    if (!customer) throw new ApiError(404, "Customer not found");

    return NextResponse.json({ customer });
  },
);

export const PATCH = handle(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const ctx = await requirePermission(PERMISSIONS.CUSTOMER_MANAGE);
    const { id } = await params;
    const data = customerSchema.partial().parse(await req.json());

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName || null }),
        ...(data.email !== undefined && { email: data.email || null }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.gender !== undefined && { gender: data.gender || null }),
        ...(data.dateOfBirth !== undefined && {
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
    });

    await audit(ctx, "customer.updated", "Customer", id);
    return NextResponse.json({ customer });
  },
);

export const DELETE = handle(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const ctx = await requirePermission(PERMISSIONS.CUSTOMER_MANAGE);
    const { id } = await params;

    await prisma.customer.delete({ where: { id } });
    await audit(ctx, "customer.deleted", "Customer", id);
    return NextResponse.json({ ok: true });
  },
);
