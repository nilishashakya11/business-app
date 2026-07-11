import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requirePermission } from "@/lib/api-auth";
import { PERMISSIONS } from "@/lib/rbac";

export const GET = handle(async () => {
  await requirePermission(PERMISSIONS.SERVICE_VIEW);
  const categories = await prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ categories });
});
