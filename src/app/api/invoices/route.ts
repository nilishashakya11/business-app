import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requirePermission, assertBranchAccess, audit } from "@/lib/api-auth";
import { invoiceSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/rbac";
import { computeInvoice, computeLine } from "@/lib/billing";
import { generateDocNumber } from "@/lib/utils";

export const GET = handle(async (req: NextRequest) => {
  const ctx = await requirePermission(PERMISSIONS.BILLING_VIEW);
  const params = req.nextUrl.searchParams;
  const branchId = params.get("branchId");
  const status = params.get("status");
  if (branchId) assertBranchAccess(ctx, branchId);

  const invoices = await prisma.invoice.findMany({
    where: {
      ...(branchId ? { branchId } : {}),
      ...(status ? { status: status as never } : {}),
    },
    orderBy: { issuedAt: "desc" },
    take: 100,
    include: {
      customer: { select: { firstName: true, lastName: true } },
      _count: { select: { items: true } },
    },
  });

  return NextResponse.json({ invoices });
});

export const POST = handle(async (req: NextRequest) => {
  const ctx = await requirePermission(PERMISSIONS.BILLING_MANAGE);
  const data = invoiceSchema.parse(await req.json());
  assertBranchAccess(ctx, data.branchId);

  const totals = computeInvoice(
    data.items.map((i) => ({
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discount: i.discount,
      taxRate: i.taxRate,
    })),
    data.discountTotal,
  );

  const invoice = await prisma.$transaction(async (tx) => {
    const created = await tx.invoice.create({
      data: {
        invoiceNumber: generateDocNumber("INV"),
        branchId: data.branchId,
        customerId: data.customerId || null,
        appointmentId: data.appointmentId || null,
        createdById: ctx.userId,
        status: "ISSUED",
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        notes: data.notes || null,
        items: {
          create: data.items.map((i) => ({
            description: i.description,
            serviceId: i.serviceId || null,
            productId: i.productId || null,
            staffId: i.staffId || null,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            discount: i.discount,
            taxRate: i.taxRate,
            lineTotal: computeLine(i).lineTotal,
          })),
        },
      },
    });

    // Decrement stock for any product line items.
    for (const item of data.items) {
      if (item.productId) {
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            branchId: data.branchId,
            productId: item.productId,
            type: "SALE",
            quantity: -item.quantity,
            reason: `Invoice ${created.invoiceNumber}`,
          },
        });
      }
    }

    // Mark a linked appointment as completed.
    if (data.appointmentId) {
      await tx.appointment.update({
        where: { id: data.appointmentId },
        data: { status: "COMPLETED" },
      });
    }

    return created;
  });

  await audit(ctx, "invoice.created", "Invoice", invoice.id);
  return NextResponse.json({ invoice }, { status: 201 });
});
