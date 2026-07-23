import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { toDateInput } from "@/lib/utils";
import { AppointmentForm } from "../../appointment-form";
import { loadAppointmentOptions } from "../../appointment-data";

export const metadata = { title: "Edit appointment — Glow & Go" };

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuth();
  const canViewAll = ctx.permissions.includes(PERMISSIONS.APPOINTMENT_VIEW);
  const canViewOwn = ctx.permissions.includes(PERMISSIONS.APPOINTMENT_VIEW_OWN);
  if (!canViewAll && !canViewOwn) redirect("/dashboard");

  const { branchId } = await resolveActiveBranch(ctx);
  if (!branchId) redirect("/calendar");
  const { id } = await params;

  const appointment = await prisma.appointment.findFirst({
    where: { id, branchId },
    include: { services: { select: { serviceId: true } } },
  });
  if (!appointment) notFound();

  const options = await loadAppointmentOptions(branchId);
  const backHref = `/calendar?date=${toDateInput(appointment.startTime)}`;

  return (
    <AppointmentForm
      branchId={branchId}
      backHref={backHref}
      canDelete={ctx.permissions.includes(PERMISSIONS.APPOINTMENT_DELETE)}
      appointment={{
        id: appointment.id,
        customerId: appointment.customerId,
        staffId: appointment.staffId,
        startTime: appointment.startTime.toISOString(),
        notes: appointment.notes,
        serviceIds: appointment.services.map((s) => s.serviceId),
      }}
      {...options}
    />
  );
}
