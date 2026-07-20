import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, eachMonthOfInterval, format } from "date-fns";

export interface ReportRange {
  from: Date;
  to: Date;
}

export interface SalesReportRow {
  invoiceNumber: string;
  date: Date;
  customer: string;
  items: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
}

export interface ReportsData {
  summary: {
    grossRevenue: number;
    invoiceCount: number;
    avgTicket: number;
    discountTotal: number;
    taxTotal: number;
    cancellationRate: number;
    newCustomers: number;
  };
  revenueByMonth: { label: string; revenue: number }[];
  paymentMix: { method: string; amount: number }[];
  topServices: { name: string; count: number; revenue: number }[];
  staffPerformance: {
    name: string;
    appointments: number;
    revenue: number;
    commission: number;
  }[];
  sales: SalesReportRow[];
}

const METHOD_LABELS: Record<string, string> = {
  CASH: "Cash",
  CARD: "Card",
  ESEWA: "eSewa",
  KHALTI: "Khalti",
  FONEPAY: "Fonepay",
  IMEPAY: "IME Pay",
  BANK_TRANSFER: "Bank transfer",
  LOYALTY_POINTS: "Loyalty points",
  COMPLIMENTARY: "Complimentary",
};

export async function getReportsData(branchId: string, range: ReportRange): Promise<ReportsData> {
  const from = startOfDay(range.from);
  const to = endOfDay(range.to);

  const paidWhere = {
    branchId,
    status: "PAID" as const,
    issuedAt: { gte: from, lte: to },
  };

  const [
    invoiceAgg,
    invoices,
    totalAppointments,
    cancelledAppointments,
    newCustomers,
    payments,
    serviceItems,
    commissionRows,
    staffAppointments,
  ] = await Promise.all([
    prisma.invoice.aggregate({
      where: paidWhere,
      _sum: { total: true, discountTotal: true, taxTotal: true },
      _avg: { total: true },
      _count: true,
    }),
    prisma.invoice.findMany({
      where: { branchId, issuedAt: { gte: from, lte: to } },
      orderBy: { issuedAt: "desc" },
      include: {
        customer: { select: { firstName: true, lastName: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.appointment.count({ where: { branchId, startTime: { gte: from, lte: to } } }),
    prisma.appointment.count({
      where: { branchId, startTime: { gte: from, lte: to }, status: { in: ["CANCELLED", "NO_SHOW"] } },
    }),
    prisma.customer.count({ where: { createdAt: { gte: from, lte: to } } }),
    prisma.payment.groupBy({
      by: ["method"],
      where: { status: "COMPLETED", invoice: { branchId }, paidAt: { gte: from, lte: to } },
      _sum: { amount: true },
    }),
    prisma.invoiceItem.groupBy({
      by: ["serviceId"],
      where: { serviceId: { not: null }, invoice: paidWhere },
      _count: { serviceId: true },
      _sum: { lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 8,
    }),
    prisma.commission.groupBy({
      by: ["staffId"],
      where: { earnedAt: { gte: from, lte: to }, staff: { branchId } },
      _sum: { amount: true },
    }),
    prisma.appointment.groupBy({
      by: ["staffId"],
      where: { branchId, startTime: { gte: from, lte: to }, staffId: { not: null } },
      _count: { staffId: true },
    }),
  ]);

  // Revenue by month across the range.
  const months = eachMonthOfInterval({ start: from, end: to });
  const monthKeys = new Map<string, number>();
  for (const m of months) monthKeys.set(format(m, "yyyy-MM"), 0);
  for (const inv of invoices) {
    if (inv.status !== "PAID") continue;
    const key = format(inv.issuedAt, "yyyy-MM");
    if (monthKeys.has(key)) monthKeys.set(key, (monthKeys.get(key) ?? 0) + Number(inv.total));
  }
  const revenueByMonth = Array.from(monthKeys.entries()).map(([key, revenue]) => ({
    label: format(new Date(key + "-01"), "MMM yyyy"),
    revenue,
  }));

  const paymentMix = payments.map((p) => ({
    method: METHOD_LABELS[p.method] ?? p.method,
    amount: Number(p._sum.amount ?? 0),
  }));

  // Top services.
  const serviceIds = serviceItems.map((i) => i.serviceId!).filter(Boolean);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true },
  });
  const serviceName = new Map(services.map((s) => [s.id, s.name]));
  const topServices = serviceItems.map((i) => ({
    name: serviceName.get(i.serviceId!) ?? "Unknown",
    count: i._count.serviceId,
    revenue: Number(i._sum.lineTotal ?? 0),
  }));

  // Staff performance: join appointment counts + commissions + revenue from invoice items.
  const staffIds = Array.from(
    new Set([
      ...staffAppointments.map((s) => s.staffId!).filter(Boolean),
      ...commissionRows.map((c) => c.staffId),
    ]),
  );
  const staffRecords = await prisma.staff.findMany({
    where: { id: { in: staffIds } },
    include: { user: { select: { name: true } } },
  });
  const revenueByStaff = await prisma.invoiceItem.groupBy({
    by: ["staffId"],
    where: { staffId: { in: staffIds }, invoice: paidWhere },
    _sum: { lineTotal: true },
  });
  const apptMap = new Map(staffAppointments.map((s) => [s.staffId, s._count.staffId]));
  const commMap = new Map(commissionRows.map((c) => [c.staffId, Number(c._sum.amount ?? 0)]));
  const revMap = new Map(revenueByStaff.map((r) => [r.staffId, Number(r._sum.lineTotal ?? 0)]));
  const staffPerformance = staffRecords
    .map((s) => ({
      name: s.user.name,
      appointments: apptMap.get(s.id) ?? 0,
      revenue: revMap.get(s.id) ?? 0,
      commission: commMap.get(s.id) ?? 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const sales: SalesReportRow[] = invoices.map((inv) => ({
    invoiceNumber: inv.invoiceNumber,
    date: inv.issuedAt,
    customer: inv.customer
      ? `${inv.customer.firstName} ${inv.customer.lastName ?? ""}`.trim()
      : "Walk-in",
    items: inv._count.items,
    subtotal: Number(inv.subtotal),
    discount: Number(inv.discountTotal),
    tax: Number(inv.taxTotal),
    total: Number(inv.total),
    status: inv.status,
  }));

  return {
    summary: {
      grossRevenue: Number(invoiceAgg._sum.total ?? 0),
      invoiceCount: invoiceAgg._count,
      avgTicket: Number(invoiceAgg._avg.total ?? 0),
      discountTotal: Number(invoiceAgg._sum.discountTotal ?? 0),
      taxTotal: Number(invoiceAgg._sum.taxTotal ?? 0),
      cancellationRate: totalAppointments > 0 ? (cancelledAppointments / totalAppointments) * 100 : 0,
      newCustomers,
    },
    revenueByMonth,
    paymentMix,
    topServices,
    staffPerformance,
    sales,
  };
}
