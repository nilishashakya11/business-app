import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { PageHeader } from "@/components/shell/page-header";
import { StaffClient, type StaffListItem } from "./staff-client";

export const metadata = { title: "Team — Glow & Go" };

export default async function StaffPage() {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.STAFF_VIEW)) redirect("/dashboard");

  const { branchId } = await resolveActiveBranch(ctx);

  const staff = branchId
    ? await prisma.staff.findMany({
        where: { branchId },
        orderBy: { user: { name: "asc" } },
        include: {
          user: { select: { name: true, email: true, phone: true, role: true, isActive: true } },
          _count: { select: { appointments: true } },
        },
      })
    : [];

  const list: StaffListItem[] = staff.map((s) => ({
    id: s.id,
    name: s.user.name,
    email: s.user.email,
    phone: s.user.phone,
    jobTitle: s.jobTitle,
    role: s.user.role,
    commissionRate: s.commissionRate.toString(),
    color: s.color,
    isActive: s.user.isActive,
    appointmentCount: s._count.appointments,
  }));

  return (
    <div>
      <PageHeader
        title="Team"
        description="The people who work at this branch."
      />
      <StaffClient
        staff={list}
        branchId={branchId}
        canManage={ctx.permissions.includes(PERMISSIONS.STAFF_MANAGE)}
      />
    </div>
  );
}
