import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requirePermission, assertBranchAccess, audit, ApiError } from "@/lib/api-auth";
import { paymentSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/rbac";
import { round2 } from "@/lib/billing";

export const POST = handle(async (req: NextRequest) => {
  const ctx = await requirePermission(PERMISSIONS.BILLING_MANAGE);
  const data = paymentSchema.parse(await req.json());

  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    select: { branchId: true, total: true, amountPaid: true, status: true, customerId: true },
  });
  if (!invoice) throw new ApiError(404, "Invoice not found");
  assertBranchAccess(ctx, invoice.branchId);
  if (invoice.status === "VOID" || invoice.status === "REFUNDED") {
    throw new ApiError(400, "Cannot take payment on a voided or refunded invoice");
  }

  const total = Number(invoice.total);
  const alreadyPaid = Number(invoice.amountPaid);
  const outstanding = round2(total - alreadyPaid);
  if (data.amount > outstanding + 0.01) {
    throw new ApiError(400, `Payment exceeds the outstanding balance of ${outstanding}`);
  }

  const newPaid = round2(alreadyPaid + data.amount);
  const fullyPaid = newPaid >= total - 0.01;

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        method: data.method,
        status: "COMPLETED",
        paidAt: new Date(),
      },
    });

    await tx.invoice.update({
      where: { id: data.invoiceId },
      data: {
        amountPaid: newPaid,
        status: fullyPaid ? "PAID" : "PARTIALLY_PAID",
      },
    });

    // Award loyalty points (1 point per 100 spent) once the invoice is settled.
    if (fullyPaid && invoice.customerId) {
      const points = Math.floor(total / 100);
      if (points > 0) {
        await tx.customer.update({
          where: { id: invoice.customerId },
          data: { loyaltyPoints: { increment: points } },
        });
      }
    }

    return created;
  });

  await audit(ctx, "payment.recorded", "Payment", payment.id, { method: data.method });
  return NextResponse.json({ payment }, { status: 201 });
});
