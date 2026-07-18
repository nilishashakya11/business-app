import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Receipt } from "lucide-react";
import { PosClient } from "./pos-client";

export const metadata = { title: "New sale — Glow & Go" };

export default async function NewSalePage() {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.BILLING_MANAGE)) redirect("/dashboard");

  const { branchId } = await resolveActiveBranch(ctx);

  if (!branchId) {
    return (
      <div>
        <PageHeader title="New sale" description="Ring up services and products." />
        <EmptyState
          icon={Receipt}
          title="No branch selected"
          description="Select a branch from the top bar to start a sale."
        />
      </div>
    );
  }

  const [services, products, customers] = await Promise.all([
    prisma.service.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, price: true, taxRate: true },
    }),
    prisma.product.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, sellPrice: true },
    }),
    prisma.customer.findMany({
      orderBy: { firstName: "asc" },
      take: 500,
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  const catalog = [
    ...services.map((s) => ({
      id: s.id,
      name: s.name,
      price: Number(s.price),
      taxRate: Number(s.taxRate),
      kind: "service" as const,
    })),
    ...products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.sellPrice),
      taxRate: 13,
      kind: "product" as const,
    })),
  ];

  return (
    <div>
      <PageHeader title="New sale" description="Ring up services and products." />
      <PosClient
        branchId={branchId}
        catalog={catalog}
        customers={customers.map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName ?? ""}`.trim(),
        }))}
      />
    </div>
  );
}
