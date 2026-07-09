import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Mail, Phone, MapPin, Cake, Award } from "lucide-react";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/appointments/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarDays, Receipt } from "lucide-react";
import { formatCurrency, formatDate, formatTime, initials } from "@/lib/utils";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.CUSTOMER_VIEW)) redirect("/dashboard");
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      appointments: {
        orderBy: { startTime: "desc" },
        take: 15,
        include: {
          services: { include: { service: { select: { name: true } } } },
          staff: { include: { user: { select: { name: true } } } },
        },
      },
      invoices: { orderBy: { issuedAt: "desc" }, take: 15 },
      memberships: { where: { status: "ACTIVE" }, include: { plan: true } },
    },
  });

  if (!customer) notFound();

  const fullName = `${customer.firstName} ${customer.lastName ?? ""}`.trim();
  const totalSpent = customer.invoices
    .filter((i) => i.status === "PAID")
    .reduce((sum, i) => sum + Number(i.total), 0);

  return (
    <div className="space-y-6">
      <Link
        href="/customers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to customers
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-accent text-xl font-semibold text-accent-foreground">
          {initials(fullName)}
        </div>
        <div className="flex-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{fullName}</h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {customer.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="size-3.5" />
                {customer.phone}
              </span>
            )}
            {customer.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {customer.email}
              </span>
            )}
            {customer.address && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-3.5" />
                {customer.address}
              </span>
            )}
            {customer.dateOfBirth && (
              <span className="flex items-center gap-1.5">
                <Cake className="size-3.5" />
                {formatDate(customer.dateOfBirth)}
              </span>
            )}
          </div>
        </div>
        {customer.memberships[0] && (
          <Badge className="gap-1.5">
            <Award className="size-3.5" />
            {customer.memberships[0].plan.name} member
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Total spent</p>
          <p className="mt-1 font-display text-lg font-semibold">{formatCurrency(totalSpent)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Appointments</p>
          <p className="mt-1 font-display text-lg font-semibold">
            {customer.appointments.length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Loyalty points</p>
          <p className="mt-1 font-display text-lg font-semibold">{customer.loyaltyPoints}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Customer since</p>
          <p className="mt-1 font-display text-lg font-semibold">
            {formatDate(customer.createdAt, { year: "numeric", month: "short" })}
          </p>
        </Card>
      </div>

      {customer.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">{customer.notes}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appointment history</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.appointments.length === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="No appointments"
                description="This customer hasn't booked yet."
                className="py-10"
              />
            ) : (
              <ul className="divide-y">
                {customer.appointments.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {a.services.map((s) => s.service.name).join(", ") || "Appointment"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(a.startTime)} at {formatTime(a.startTime)} &middot;{" "}
                        {a.staff?.user.name ?? "Unassigned"}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {customer.invoices.length === 0 ? (
              <EmptyState
                icon={Receipt}
                title="No invoices"
                description="No billing history for this customer."
                className="py-10"
              />
            ) : (
              <ul className="divide-y">
                {customer.invoices.map((inv) => (
                  <li key={inv.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/billing/${inv.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {inv.invoiceNumber}
                      </Link>
                      <p className="text-xs text-muted-foreground">{formatDate(inv.issuedAt)}</p>
                    </div>
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(Number(inv.total))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
