import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Receipt } from "lucide-react";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, formatDate } from "@/lib/utils";

export const metadata = { title: "Billing — Glow & Go" };

const STATUS_VARIANT: Record<string, string> = {
  PAID: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  PARTIALLY_PAID: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  ISSUED: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  DRAFT: "bg-slate-500/10 text-slate-600 border-slate-500/20",
  VOID: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  REFUNDED: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default async function BillingPage() {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.BILLING_VIEW)) redirect("/dashboard");

  const { branchId } = await resolveActiveBranch(ctx);
  const canManage = ctx.permissions.includes(PERMISSIONS.BILLING_MANAGE);

  const invoices = branchId
    ? await prisma.invoice.findMany({
        where: { branchId },
        orderBy: { issuedAt: "desc" },
        take: 100,
        include: { customer: { select: { firstName: true, lastName: true } } },
      })
    : [];

  return (
    <div>
      <PageHeader title="Billing" description="Invoices and payments for this branch.">
        {canManage && branchId && (
          <Button asChild>
            <Link href="/billing/new">
              <Plus className="size-4" />
              New sale
            </Link>
          </Button>
        )}
      </PageHeader>

      {invoices.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No invoices yet"
          description={branchId ? "Create a sale to get started." : "Select a branch to view billing."}
          action={
            canManage && branchId ? (
              <Button asChild>
                <Link href="/billing/new">
                  <Plus className="size-4" />
                  New sale
                </Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y">
              {invoices.map((inv) => (
                <li key={inv.id}>
                  <Link
                    href={`/billing/${inv.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{inv.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.customer
                          ? `${inv.customer.firstName} ${inv.customer.lastName ?? ""}`.trim()
                          : "Walk-in"}{" "}
                        &middot; {formatDate(inv.issuedAt)}
                      </p>
                    </div>
                    <Badge variant="outline" className={STATUS_VARIANT[inv.status] ?? ""}>
                      {inv.status.replace("_", " ").toLowerCase()}
                    </Badge>
                    <span className="w-28 text-right text-sm font-semibold tabular-nums">
                      {formatCurrency(Number(inv.total))}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
