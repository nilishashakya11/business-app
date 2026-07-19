import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handle, requirePermission, assertBranchAccess, audit, ApiError } from "@/lib/api-auth";
import { productSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/rbac";

export const PATCH = handle(
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const ctx = await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
    const { id } = await params;
    // Quantity is managed through stock movements, not direct edits.
    const data = productSchema.omit({ branchId: true, quantity: true }).partial().parse(await req.json());

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { branchId: true },
    });
    if (!existing) throw new ApiError(404, "Product not found");
    assertBranchAccess(ctx, existing.branchId);

    try {
      const product = await prisma.product.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.sku !== undefined && { sku: data.sku || null }),
          ...(data.description !== undefined && { description: data.description || null }),
          ...(data.supplierId !== undefined && { supplierId: data.supplierId || null }),
          ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
          ...(data.sellPrice !== undefined && { sellPrice: data.sellPrice }),
          ...(data.lowStockLevel !== undefined && { lowStockLevel: data.lowStockLevel }),
          ...(data.unit !== undefined && { unit: data.unit }),
        },
      });
      await audit(ctx, "product.updated", "Product", id);
      return NextResponse.json({ product });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
        throw new ApiError(409, "A product with this SKU already exists in this branch");
      }
      throw err;
    }
  },
);

export const DELETE = handle(
  async (_req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const ctx = await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
    const { id } = await params;

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { branchId: true },
    });
    if (!existing) throw new ApiError(404, "Product not found");
    assertBranchAccess(ctx, existing.branchId);

    // Soft-delete: deactivate so historical invoice lines stay intact.
    await prisma.product.update({ where: { id }, data: { isActive: false } });
    await audit(ctx, "product.deactivated", "Product", id);
    return NextResponse.json({ ok: true });
  },
);
