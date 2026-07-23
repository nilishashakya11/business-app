import { prisma } from "@/lib/prisma";
import type { ServiceOption, StaffOption, CustomerOption } from "./appointment-form";

/**
 * Shared loader for the appointment form's option lists (services, staff,
 * customers). Used by both the "new" and "edit" appointment pages so they
 * stay in sync with the calendar page's own queries.
 */
export async function loadAppointmentOptions(branchId: string): Promise<{
  services: ServiceOption[];
  staff: StaffOption[];
  customers: CustomerOption[];
}> {
  const [services, staff, customers] = await Promise.all([
    prisma.service.findMany({
      where: { branchId, isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, durationMinutes: true, price: true },
    }),
    prisma.staff.findMany({
      where: { branchId, user: { isActive: true } },
      orderBy: { user: { name: "asc" } },
      select: { id: true, user: { select: { name: true } } },
    }),
    prisma.customer.findMany({
      orderBy: { firstName: "asc" },
      take: 500,
      select: { id: true, firstName: true, lastName: true },
    }),
  ]);

  return {
    services: services.map((s) => ({
      id: s.id,
      name: s.name,
      durationMinutes: s.durationMinutes,
      price: Number(s.price),
    })),
    staff: staff.map((s) => ({ id: s.id, name: s.user.name })),
    customers: customers.map((c) => ({
      id: c.id,
      name: `${c.firstName} ${c.lastName ?? ""}`.trim(),
    })),
  };
}
