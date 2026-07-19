import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { PageHeader } from "@/components/shell/page-header";
import { InventoryClient, type ProductListItem } from "./inventory-client";

export const metadata = { title: "Inventory — Glow & Go" };

export default async function InventoryPage() {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.INVENTORY_VIEW)) redirect("/dashboard");

  const { branchId } = await resolveActiveBranch(ctx);
  const canManage = ctx.permissions.includes(PERMISSIONS.INVENTORY_MANAGE);

  const products = branchId
    ? await prisma.product.findMany({
        where: { branchId, isActive: true },
        orderBy: { name: "asc" },
        include: { supplier: { select: { name: true } } },
      })
    : [];

  const list: ProductListItem[] = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    description: p.description,
    costPrice: Number(p.costPrice),
    sellPrice: Number(p.sellPrice),
    quantity: p.quantity,
    lowStockLevel: p.lowStockLevel,
    unit: p.unit,
    supplierName: p.supplier?.name ?? null,
  }));

  return (
    <div>
      <PageHeader title="Inventory" description="Products and stock levels for this branch." />
      <InventoryClient products={list} branchId={branchId} canManage={canManage} />
    </div>
  );
}
