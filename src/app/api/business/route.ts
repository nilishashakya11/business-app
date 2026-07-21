import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requirePermission, handle, audit } from "@/lib/api-auth";
import { PERMISSIONS } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

const businessSchema = z.object({
  name: z.string().min(1),
  currency: z.string().min(1).max(8),
  timezone: z.string().min(1),
});

/** GET /api/business — the primary business record (admin). */
export const GET = handle(async () => {
  await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  return NextResponse.json({ business });
});

/** PATCH /api/business — update business settings (admin). */
export const PATCH = handle(async (req: NextRequest) => {
  const ctx = await requirePermission(PERMISSIONS.SETTINGS_MANAGE);
  const body = businessSchema.parse(await req.json());

  const existing = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  if (!existing) {
    return NextResponse.json({ error: "No business configured" }, { status: 400 });
  }

  const business = await prisma.business.update({
    where: { id: existing.id },
    data: {
      name: body.name,
      currency: body.currency,
      timezone: body.timezone,
    },
  });

  await audit(ctx, "business.updated", "Business", business.id);
  return NextResponse.json({ business });
});
