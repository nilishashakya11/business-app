import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, handle, audit } from "@/lib/api-auth";
import { PERMISSIONS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

const branchSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
});

/** GET /api/branches — list all branches (admin). */
export const GET = handle(async () => {
  await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
  const branches = await prisma.branch.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { staff: true, appointments: true } } },
  });
  return NextResponse.json({ branches });
});

/** POST /api/branches — create a branch and attach it to the business (admin). */
export const POST = handle(async (req: NextRequest) => {
  const ctx = await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
  const body = branchSchema.parse(await req.json());

  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  if (!business) {
    return NextResponse.json({ error: "No business configured" }, { status: 400 });
  }

  const branch = await prisma.branch.create({
    data: {
      businessId: business.id,
      name: body.name,
      address: body.address || null,
      city: body.city || null,
      phone: body.phone || null,
      email: body.email || null,
    },
  });

  // Give the creating admin access to the new branch.
  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId: ctx.userId, branchId: branch.id } },
    create: { userId: ctx.userId, branchId: branch.id },
    update: {},
  });

  await audit(ctx, "branch.created", "Branch", branch.id, { name: branch.name });
  return NextResponse.json({ branch }, { status: 201 });
});
