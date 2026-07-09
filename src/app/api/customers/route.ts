import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requireAuth, requirePermission, audit } from "@/lib/api-auth";
import { customerSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/rbac";
import { Prisma } from "@prisma/client";

export const GET = handle(async (req: NextRequest) => {
  await requirePermission(PERMISSIONS.CUSTOMER_VIEW);
  const q = req.nextUrl.searchParams.get("q")?.trim();

  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { phone: { contains: q } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      _count: { select: { appointments: true, invoices: true } },
    },
  });

  return NextResponse.json({ customers });
});

export const POST = handle(async (req: NextRequest) => {
  const ctx = await requirePermission(PERMISSIONS.CUSTOMER_MANAGE);
  const data = customerSchema.parse(await req.json());

  // A business is required; use the branch's business via the user's context.
  const branch = await prisma.branch.findFirst({
    where: ctx.role === "ADMIN" ? {} : { id: { in: ctx.branchIds } },
    select: { businessId: true },
  });
  if (!branch) throw new Error("No business found");

  const customer = await prisma.customer.create({
    data: {
      businessId: branch.businessId,
      firstName: data.firstName,
      lastName: data.lastName || null,
      email: data.email || null,
      phone: data.phone || null,
      gender: data.gender || null,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      address: data.address || null,
      notes: data.notes || null,
    },
  });

  await audit(ctx, "customer.created", "Customer", customer.id);
  return NextResponse.json({ customer }, { status: 201 });
});
