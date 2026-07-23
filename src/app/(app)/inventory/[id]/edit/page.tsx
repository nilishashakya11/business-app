import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { ProductForm } from "../../product-form";

export const metadata = { title: "Edit product — Glow & Go" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.INVENTORY_MANAGE)) redirect("/inventory");

  const { branchId } = await resolveActiveBranch(ctx);
  if (!branchId) redirect("/inventory");

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product || product.branchId !== branchId) notFound();

  return (
    <ProductForm
      branchId={branchId}
      product={{
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        costPrice: Number(product.costPrice),
        sellPrice: Number(product.sellPrice),
        quantity: product.quantity,
        lowStockLevel: product.lowStockLevel,
        unit: product.unit,
      }}
    />
  );
}
