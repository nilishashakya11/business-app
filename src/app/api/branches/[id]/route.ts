import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, handle, audit, ApiError } from "@/lib/api-auth";
import { PERMISSIONS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

/** PATCH /api/branches/:id — update a branch (admin). */
export const PATCH = handle(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const ctx = await requirePermission(PERMISSIONS.BRANCHES_MANAGE);
    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) throw new ApiError(404, "Branch not found");

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.address !== undefined ? { address: body.address || null } : {}),
        ...(body.city !== undefined ? { city: body.city || null } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(body.email !== undefined ? { email: body.email || null } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
      },
    });

    await audit(ctx, "branch.updated", "Branch", id);
    return NextResponse.json({ branch });
  },
);
