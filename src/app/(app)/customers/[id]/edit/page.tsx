import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { CustomerForm } from "../../customer-form";

export const metadata = { title: "Edit customer — Glow & Go" };

export default async function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.CUSTOMER_MANAGE)) redirect("/customers");
  const { id } = await params;

  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) notFound();

  return (
    <CustomerForm
      customer={{
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        phone: customer.phone,
        gender: customer.gender,
        address: customer.address,
        notes: customer.notes,
      }}
    />
  );
}
