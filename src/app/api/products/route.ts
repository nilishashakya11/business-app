import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handle, requirePermission, assertBranchAccess, audit, ApiError } from "@/lib/api-auth";
import { productSchema } from "@/lib/validations";
import { PERMISSIONS } from "@/lib/rbac";

export const GET = handle(async (req: NextRequest) => {
  const ctx = await requirePermission(PERMISSIONS.INVENTORY_VIEW);
  const branchId = req.nextUrl.searchParams.get("branchId");
  if (!branchId) throw new ApiError(400, "branchId is required");
  assertBranchAccess(ctx, branchId);

  const products = await prisma.product.findMany({
    where: { branchId },
    orderBy: { name: "asc" },
    include: { supplier: { select: { name: true } } },
  });

  return NextResponse.json({ products });
});

export const POST = handle(async (req: NextRequest) => {
  const ctx = await requirePermission(PERMISSIONS.INVENTORY_MANAGE);
  const data = productSchema.parse(await req.json());
  assertBranchAccess(ctx, data.branchId);

  try {
    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          branchId: data.branchId,
          supplierId: data.supplierId || null,
          name: data.name,
          sku: data.sku || null,
          description: data.description || null,
          costPrice: data.costPrice,
          sellPrice: data.sellPrice,
          quantity: data.quantity,
          lowStockLevel: data.lowStockLevel,
          unit: data.unit,
        },
      });

      // Record the opening balance as a stock movement for traceability.
      if (data.quantity > 0) {
        await tx.stockMovement.create({
          data: {
            branchId: data.branchId,
            productId: created.id,
            type: "PURCHASE",
            quantity: data.quantity,
            reason: "Opening stock",
          },
        });
      }

      return created;
    });

    await audit(ctx, "product.created", "Product", product.id);
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ApiError(409, "A product with this SKU already exists in this branch");
    }
    throw err;
  }
});
