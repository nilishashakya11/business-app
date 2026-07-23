import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { PERMISSIONS } from "@/lib/rbac";
import { StaffForm } from "../staff-form";

export const metadata = { title: "New team member — Glow & Go" };

export default async function NewStaffPage() {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.STAFF_MANAGE)) redirect("/staff");

  const { branchId } = await resolveActiveBranch(ctx);
  if (!branchId) redirect("/staff");

  return <StaffForm branchId={branchId} />;
}
