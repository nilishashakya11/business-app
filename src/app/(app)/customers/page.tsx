import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { PageHeader } from "@/components/shell/page-header";
import { CustomersClient, type CustomerListItem } from "./customers-client";

export const metadata = { title: "Customers — Glow & Go" };

export default async function CustomersPage() {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.CUSTOMER_VIEW)) redirect("/dashboard");

  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { _count: { select: { appointments: true, invoices: true } } },
  });

  const list: CustomerListItem[] = customers.map((c) => ({
    id: c.id,
    firstName: c.firstName,
    lastName: c.lastName,
    email: c.email,
    phone: c.phone,
    gender: c.gender,
    address: c.address,
    notes: c.notes,
    loyaltyPoints: c.loyaltyPoints,
    _count: c._count,
  }));

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Everyone who books with you, across all branches."
      />
      <CustomersClient
        initialCustomers={list}
        canManage={ctx.permissions.includes(PERMISSIONS.CUSTOMER_MANAGE)}
      />
    </div>
  );
}
