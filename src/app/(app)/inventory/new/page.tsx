import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { PERMISSIONS } from "@/lib/rbac";
import { ProductForm } from "../product-form";

export const metadata = { title: "New product — Glow & Go" };

export default async function NewProductPage() {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.INVENTORY_MANAGE)) redirect("/inventory");

  const { branchId } = await resolveActiveBranch(ctx);
  if (!branchId) redirect("/inventory");

  return <ProductForm branchId={branchId} />;
}
