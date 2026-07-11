import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { PageHeader } from "@/components/shell/page-header";
import { ServicesClient, type ServiceListItem } from "./services-client";

export const metadata = { title: "Services — Glow & Go" };

export default async function ServicesPage() {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.SERVICE_VIEW)) redirect("/dashboard");

  const { branchId } = await resolveActiveBranch(ctx);

  const [services, categories] = await Promise.all([
    branchId
      ? prisma.service.findMany({
          where: { branchId },
          orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
          include: { category: { select: { id: true, name: true } } },
        })
      : Promise.resolve([]),
    prisma.serviceCategory.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);

  const list: ServiceListItem[] = services.map((s) => ({
    id: s.id,
    name: s.name,
    categoryId: s.categoryId,
    description: s.description,
    durationMinutes: s.durationMinutes,
    price: s.price.toString(),
    taxRate: s.taxRate.toString(),
    isActive: s.isActive,
    category: s.category,
  }));

  return (
    <div>
      <PageHeader
        title="Services"
        description="The treatments and services offered at this branch."
      />
      <ServicesClient
        services={list}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        branchId={branchId}
        canManage={ctx.permissions.includes(PERMISSIONS.SERVICE_MANAGE)}
      />
    </div>
  );
}
