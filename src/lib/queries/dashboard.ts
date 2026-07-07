import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, subDays, format } from "date-fns";
import type { RevenuePoint } from "@/components/dashboard/revenue-chart";

export interface DashboardData {
  revenueToday: number;
  revenuePrev: number;
  revenueDelta: number | null;
  appointmentsToday: number;
  newCustomers: number;
  avgTicket: number;
  revenueSeries: RevenuePoint[];
  topServices: { name: string; count: number; revenue: number }[];
  upcoming: {
    id: string;
    startTime: Date;
    status: string;
    customer: string;
    staff: string;
    service: string;
  }[];
  lowStock: number;
}

function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export async function getDashboardData(branchId: string): Promise<DashboardData> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const yesterdayStart = startOfDay(subDays(now, 1));

  const [
    paidToday,
    paidYesterday,
    appointmentsToday,
    newCustomers,
    invoiceAgg,
    lowStock,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { branchId, status: "PAID", issuedAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.invoice.aggregate({
      _sum: { total: true },
      where: { branchId, status: "PAID", issuedAt: { gte: yesterdayStart, lt: todayStart } },
    }),
    prisma.appointment.count({
      where: { branchId, startTime: { gte: todayStart, lte: todayEnd } },
    }),
    // New customers this week (business-wide; customers are shared across branches).
    prisma.customer.count({ where: { createdAt: { gte: subDays(now, 7) } } }),
    prisma.invoice.aggregate({
      _avg: { total: true },
      where: { branchId, status: "PAID", issuedAt: { gte: subDays(now, 30) } },
    }),
    prisma.product.count({
      where: { branchId, isActive: true, quantity: { lte: prisma.product.fields.lowStockLevel } },
    }),
  ]);

  const revenueToday = Number(paidToday._sum.total ?? 0);
  const revenuePrev = Number(paidYesterday._sum.total ?? 0);

  // 14-day revenue series.
  const seriesStart = startOfDay(subDays(now, 13));
  const invoices = await prisma.invoice.findMany({
    where: { branchId, status: "PAID", issuedAt: { gte: seriesStart } },
    select: { total: true, issuedAt: true },
  });

  const byDay = new Map<string, number>();
  for (let i = 13; i >= 0; i--) {
    byDay.set(format(subDays(now, i), "yyyy-MM-dd"), 0);
  }
  for (const inv of invoices) {
    const key = format(inv.issuedAt, "yyyy-MM-dd");
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + Number(inv.total));
  }
  const revenueSeries: RevenuePoint[] = Array.from(byDay.entries()).map(([key, revenue]) => ({
    label: format(new Date(key), "MMM d"),
    revenue,
  }));

  // Top services over the last 30 days.
  const items = await prisma.invoiceItem.groupBy({
    by: ["serviceId"],
    where: {
      serviceId: { not: null },
      invoice: { branchId, status: "PAID", issuedAt: { gte: subDays(now, 30) } },
    },
    _count: { serviceId: true },
    _sum: { lineTotal: true },
    orderBy: { _sum: { lineTotal: "desc" } },
    take: 5,
  });
  const serviceIds = items.map((i) => i.serviceId!).filter(Boolean);
  const serviceNames = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(serviceNames.map((s) => [s.id, s.name]));
  const topServices = items.map((i) => ({
    name: nameMap.get(i.serviceId!) ?? "Unknown",
    count: i._count.serviceId,
    revenue: Number(i._sum.lineTotal ?? 0),
  }));

  // Upcoming appointments today.
  const upcomingRaw = await prisma.appointment.findMany({
    where: {
      branchId,
      startTime: { gte: now, lte: todayEnd },
      status: { in: ["BOOKED", "CONFIRMED", "ARRIVED"] },
    },
    orderBy: { startTime: "asc" },
    take: 6,
    include: {
      customer: { select: { firstName: true, lastName: true } },
      staff: { include: { user: { select: { name: true } } } },
      services: { include: { service: { select: { name: true } } } },
    },
  });

  const upcoming = upcomingRaw.map((a) => ({
    id: a.id,
    startTime: a.startTime,
    status: a.status,
    customer: a.customer
      ? `${a.customer.firstName} ${a.customer.lastName ?? ""}`.trim()
      : "Walk-in",
    staff: a.staff?.user.name ?? "Unassigned",
    service: a.services[0]?.service.name ?? "—",
  }));

  return {
    revenueToday,
    revenuePrev,
    revenueDelta: pctDelta(revenueToday, revenuePrev),
    appointmentsToday,
    newCustomers,
    avgTicket: Number(invoiceAgg._avg.total ?? 0),
    revenueSeries,
    topServices,
    upcoming,
    lowStock,
  };
}
