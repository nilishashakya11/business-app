import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { PERMISSIONS } from "@/lib/rbac";
import { CustomerForm } from "../customer-form";

export const metadata = { title: "New customer — Glow & Go" };

export default async function NewCustomerPage() {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.CUSTOMER_MANAGE)) redirect("/customers");

  return <CustomerForm />;
}
