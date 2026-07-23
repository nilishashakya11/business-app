import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { ServiceForm } from "../../service-form";

export const metadata = { title: "Edit service — Glow & Go" };

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.SERVICE_MANAGE)) redirect("/services");
  const { branchId } = await resolveActiveBranch(ctx);
  if (!branchId) redirect("/services");
  const { id } = await params;

  const [service, categories] = await Promise.all([
    prisma.service.findFirst({ where: { id, branchId } }),
    prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!service) notFound();

  return (
    <ServiceForm
      branchId={branchId}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      service={{
        id: service.id,
        name: service.name,
        categoryId: service.categoryId,
        description: service.description,
        durationMinutes: service.durationMinutes,
        price: service.price.toString(),
        taxRate: service.taxRate.toString(),
        isActive: service.isActive,
      }}
    />
  );
}
