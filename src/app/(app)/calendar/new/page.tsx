import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { PERMISSIONS } from "@/lib/rbac";
import { AppointmentForm } from "../appointment-form";
import { loadAppointmentOptions } from "../appointment-data";

export const metadata = { title: "New appointment — Glow & Go" };

export default async function NewAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; date?: string }>;
}) {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.APPOINTMENT_CREATE)) redirect("/calendar");

  const { branchId } = await resolveActiveBranch(ctx);
  if (!branchId) redirect("/calendar");

  const { start, date } = await searchParams;
  const options = await loadAppointmentOptions(branchId);
  const backHref = date ? `/calendar?date=${date}` : "/calendar";

  return (
    <AppointmentForm
      branchId={branchId}
      defaultStart={start ?? null}
      backHref={backHref}
      canDelete={ctx.permissions.includes(PERMISSIONS.APPOINTMENT_DELETE)}
      {...options}
    />
  );
}
