import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { ServiceForm } from "../service-form";

export const metadata = { title: "New service — Glow & Go" };

export default async function NewServicePage() {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.SERVICE_MANAGE)) redirect("/services");

  const { branchId } = await resolveActiveBranch(ctx);
  if (!branchId) redirect("/services");

  const categories = await prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <ServiceForm
      branchId={branchId}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
