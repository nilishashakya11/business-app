"use client";

import * as React from "react";
import { Plus, Package, Pencil, ArrowUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import { ProductDialog, type ProductRecord } from "./product-dialog";
import { StockDialog } from "./stock-dialog";

export interface ProductListItem extends ProductRecord {
  supplierName: string | null;
}

export function InventoryClient({
  products,
  branchId,
  canManage,
}: {
  products: ProductListItem[];
  branchId: string | null;
  canManage: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [productOpen, setProductOpen] = React.useState(false);
  const [stockOpen, setStockOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ProductRecord | null>(null);
  const [stockTarget, setStockTarget] = React.useState<ProductListItem | null>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || (p.sku ?? "").toLowerCase().includes(q),
    );
  }, [query, products]);

  const lowCount = products.filter((p) => p.quantity <= p.lowStockLevel).length;

  function openNew() {
    setEditing(null);
    setProductOpen(true);
  }
  function openEdit(p: ProductListItem) {
    setEditing(p);
    setProductOpen(true);
  }
  function openStock(p: ProductListItem) {
    setStockTarget(p);
    setStockOpen(true);
  }

  if (!branchId) {
    return (
      <EmptyState
        icon={Package}
        title="No branch selected"
        description="Select a branch from the top bar to manage its inventory."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or SKU"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          {lowCount > 0 && (
            <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600">
              {lowCount} low on stock
            </Badge>
          )}
          {canManage && (
            <Button onClick={openNew}>
              <Plus className="size-4" />
              New product
            </Button>
          )}
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          description="Add retail and consumable products to track stock."
          action={
            canManage ? (
              <Button onClick={openNew}>
                <Plus className="size-4" />
                New product
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium">Product</th>
                    <th className="px-4 py-2.5 text-right font-medium">Cost</th>
                    <th className="px-4 py-2.5 text-right font-medium">Price</th>
                    <th className="px-4 py-2.5 text-right font-medium">In stock</th>
                    <th className="px-4 py-2.5 text-right font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filtered.map((p) => {
                    const low = p.quantity <= p.lowStockLevel;
                    return (
                      <tr key={p.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {p.sku ? `${p.sku} · ` : ""}
                            {p.supplierName ?? "No supplier"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {formatCurrency(p.costPrice)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {formatCurrency(p.sellPrice)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={
                              low
                                ? "font-semibold tabular-nums text-amber-600"
                                : "tabular-nums"
                            }
                          >
                            {p.quantity} {p.unit}
                          </span>
                          {low && (
                            <p className="text-[10px] uppercase tracking-wide text-amber-600">
                              Low
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {canManage && (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => openStock(p)}
                                title="Adjust stock"
                              >
                                <ArrowUpDown className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => openEdit(p)}
                                title="Edit"
                              >
                                <Pencil className="size-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <ProductDialog
        open={productOpen}
        onOpenChange={setProductOpen}
        branchId={branchId}
        product={editing}
      />
      <StockDialog open={stockOpen} onOpenChange={setStockOpen} product={stockTarget} />
    </div>
  );
}
