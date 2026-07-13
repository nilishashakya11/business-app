import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requirePermission, assertBranchAccess, audit, ApiError } from "@/lib/api-auth";
import { staffSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/rbac";
import { Role } from "@prisma/client";
import bcrypt from "bcryptjs";

export const GET = handle(async (req: NextRequest) => {
  await requirePermission(PERMISSIONS.STAFF_VIEW);
  const branchId = req.nextUrl.searchParams.get("branchId");

  const staff = await prisma.staff.findMany({
    where: { ...(branchId ? { branchId } : {}) },
    orderBy: { user: { name: "asc" } },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, role: true, isActive: true } },
      _count: { select: { appointments: true } },
    },
  });

  return NextResponse.json({ staff });
});

export const POST = handle(async (req: NextRequest) => {
  const ctx = await requirePermission(PERMISSIONS.STAFF_MANAGE);
  const data = staffSchema.parse(await req.json());
  assertBranchAccess(ctx, data.branchId);

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) throw new ApiError(409, "A user with this email already exists");

  const passwordHash = await bcrypt.hash(data.password || "Password123!", 10);

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role as Role,
      passwordHash,
      branches: { create: [{ branchId: data.branchId, isPrimary: true }] },
      staffProfile: {
        create: {
          branchId: data.branchId,
          jobTitle: data.jobTitle || null,
          commissionRate: data.commissionRate,
          color: data.color || null,
          hiredAt: new Date(),
          // Default 7-day working hours, Saturday off.
          workingHours: {
            create: Array.from({ length: 7 }, (_, day) => ({
              dayOfWeek: day,
              startTime: "09:00",
              endTime: "18:00",
              isOff: day === 6,
            })),
          },
        },
      },
    },
    include: { staffProfile: true },
  });

  await audit(ctx, "staff.created", "Staff", user.staffProfile?.id);
  return NextResponse.json({ staff: user.staffProfile }, { status: 201 });
});
