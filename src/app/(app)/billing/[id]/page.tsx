import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { PaymentPanel } from "./payment-panel";

export const metadata = { title: "Invoice — Glow & Go" };

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

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.BILLING_VIEW)) redirect("/dashboard");
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      items: true,
      payments: { where: { status: "COMPLETED" }, orderBy: { paidAt: "asc" } },
      branch: { select: { name: true } },
    },
  });
  if (!invoice) notFound();

  // Enforce branch scoping for non-admins.
  if (ctx.role !== "ADMIN" && !ctx.branchIds.includes(invoice.branchId)) {
    redirect("/billing");
  }

  const total = Number(invoice.total);
  const paid = Number(invoice.amountPaid);
  const outstanding = Math.max(0, Math.round((total - paid) * 100) / 100);
  const canManage = ctx.permissions.includes(PERMISSIONS.BILLING_MANAGE);
  const settled = invoice.status === "PAID" || invoice.status === "REFUNDED" || invoice.status === "VOID";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/billing"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to billing
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-xl">{invoice.invoiceNumber}</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                {invoice.branch.name} &middot; {formatDate(invoice.issuedAt)}
              </p>
            </div>
            <Badge variant="outline">{invoice.status.replace("_", " ").toLowerCase()}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm">
              <span className="text-muted-foreground">Billed to: </span>
              {invoice.customer
                ? `${invoice.customer.firstName} ${invoice.customer.lastName ?? ""}`.trim()
                : "Walk-in customer"}
            </div>

            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Item</th>
                    <th className="px-3 py-2 text-right font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Price</th>
                    <th className="px-3 py-2 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {invoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">{item.description}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{item.quantity}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(Number(item.unitPrice))}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatCurrency(Number(item.lineTotal))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums">{formatCurrency(Number(invoice.subtotal))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span className="tabular-nums">
                  -{formatCurrency(Number(invoice.discountTotal))}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums">{formatCurrency(Number(invoice.taxTotal))}</span>
              </div>
              <div className="flex justify-between border-t pt-1 text-base font-semibold">
                <span>Total</span>
                <span className="tabular-nums">{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between text-emerald-600">
                <span>Paid</span>
                <span className="tabular-nums">{formatCurrency(paid)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {canManage && !settled && outstanding > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Take payment</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentPanel invoiceId={invoice.id} outstanding={outstanding} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payments</CardTitle>
            </CardHeader>
            <CardContent>
              {invoice.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
              ) : (
                <ul className="space-y-3">
                  {invoice.payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="font-medium">{METHOD_LABELS[p.method] ?? p.method}</p>
                        <p className="text-xs text-muted-foreground">
                          {p.paidAt ? formatDateTime(p.paidAt) : "—"}
                        </p>
                      </div>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(Number(p.amount))}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
