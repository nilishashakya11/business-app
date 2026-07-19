import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, requirePermission, assertBranchAccess, audit, ApiError } from "@/lib/api-auth";
import { stockAdjustmentSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/rbac";

export const POST = handle(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const ctx = await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
    const { id } = await params;
    const data = stockAdjustmentSchema.parse(await req.json());

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { branchId: true, quantity: true },
    });
    if (!existing) throw new ApiError(404, "Product not found");
    assertBranchAccess(ctx, existing.branchId);

    if (existing.quantity + data.quantity < 0) {
      throw new ApiError(400, "Adjustment would take stock below zero");
    }

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: { quantity: { increment: data.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          branchId: existing.branchId,
          productId: id,
          type: data.type,
          quantity: data.quantity,
          reason: data.reason || null,
        },
      });
      return updated;
    });

    await audit(ctx, "stock.adjusted", "Product", id, { quantity: data.quantity, type: data.type });
    return NextResponse.json({ product });
  },
);
