import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { StaffForm } from "../../staff-form";

export const metadata = { title: "Edit team member — Glow & Go" };

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.STAFF_MANAGE)) redirect("/staff");
  const { branchId } = await resolveActiveBranch(ctx);
  if (!branchId) redirect("/staff");
  const { id } = await params;

  const staff = await prisma.staff.findFirst({
    where: { id, branchId },
    include: {
      user: { select: { name: true, email: true, phone: true, role: true } },
    },
  });
  if (!staff) notFound();

  return (
    <StaffForm
      branchId={branchId}
      staff={{
        id: staff.id,
        name: staff.user.name,
        email: staff.user.email,
        phone: staff.user.phone,
        jobTitle: staff.jobTitle,
        role: staff.user.role,
        commissionRate: staff.commissionRate.toString(),
        color: staff.color,
      }}
    />
  );
}
