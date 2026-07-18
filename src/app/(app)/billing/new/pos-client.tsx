"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { computeInvoice, computeLine } from "@/lib/billing";
import { formatCurrency } from "@/lib/utils";

interface CatalogItem {
  id: string;
  name: string;
  price: number;
  taxRate: number;
  kind: "service" | "product";
}
interface CartLine {
  key: string;
  description: string;
  serviceId: string | null;
  productId: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
}

let keySeq = 0;

export function PosClient({
  branchId,
  catalog,
  customers,
}: {
  branchId: string;
  catalog: CatalogItem[];
  customers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [customerId, setCustomerId] = React.useState("");
  const [lines, setLines] = React.useState<CartLine[]>([]);
  const [invoiceDiscount, setInvoiceDiscount] = React.useState(0);
  const [query, setQuery] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter((c) => c.name.toLowerCase().includes(q));
  }, [query, catalog]);

  function addItem(item: CatalogItem) {
    setLines((prev) => {
      // Bump quantity if this catalog item is already in the cart.
      const existing = prev.find(
        (l) =>
          (item.kind === "service" ? l.serviceId : l.productId) === item.id,
      );
      if (existing) {
        return prev.map((l) =>
          l.key === existing.key ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          key: `k${keySeq++}`,
          description: item.name,
          serviceId: item.kind === "service" ? item.id : null,
          productId: item.kind === "product" ? item.id : null,
          quantity: 1,
          unitPrice: item.price,
          discount: 0,
          taxRate: item.taxRate,
        },
      ];
    });
  }

  function updateLine(key: string, patch: Partial<CartLine>) {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }
  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }

  const totals = React.useMemo(
    () =>
      computeInvoice(
        lines.map((l) => ({
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
          taxRate: l.taxRate,
        })),
        invoiceDiscount,
      ),
    [lines, invoiceDiscount],
  );

  async function checkout() {
    if (lines.length === 0) {
      toast({ title: "Add at least one item", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const { invoice } = await apiFetch<{ invoice: { id: string } }>("/api/invoices", {
        method: "POST",
        body: JSON.stringify({
          branchId,
          customerId: customerId || null,
          items: lines.map((l) => ({
            description: l.description,
            serviceId: l.serviceId,
            productId: l.productId,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            discount: l.discount,
            taxRate: l.taxRate,
          })),
          discountTotal: invoiceDiscount,
        }),
      });
      toast({ title: "Invoice created", variant: "success" });
      router.push(`/billing/${invoice.id}`);
    } catch (err) {
      toast({
        title: "Checkout failed",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
      {/* Catalog */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services and products"
            className="pl-9"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((item) => (
            <button
              key={`${item.kind}-${item.id}`}
              onClick={() => addItem(item)}
              className="rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
            >
              <p className="text-sm font-medium leading-tight">{item.name}</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
                {item.kind}
              </p>
              <p className="mt-2 font-semibold">{formatCurrency(item.price)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart */}
      <Card className="h-fit lg:sticky lg:top-4">
        <CardContent className="space-y-4 p-4">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Walk-in" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {lines.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-muted-foreground">
                <ShoppingCart className="size-8 opacity-40" />
                Tap items to add them to the sale.
              </div>
            ) : (
              lines.map((l) => (
                <div key={l.key} className="rounded-lg border p-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">{l.description}</span>
                    <button
                      onClick={() => removeLine(l.key)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-muted-foreground">Qty</span>
                      <Input
                        type="number"
                        min={1}
                        value={l.quantity}
                        onChange={(e) =>
                          updateLine(l.key, { quantity: Math.max(1, Number(e.target.value)) })
                        }
                        className="h-8"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Price</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={l.unitPrice}
                        onChange={(e) => updateLine(l.key, { unitPrice: Number(e.target.value) })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground">Disc</span>
                      <Input
                        type="number"
                        step="0.01"
                        value={l.discount}
                        onChange={(e) => updateLine(l.key, { discount: Number(e.target.value) })}
                        className="h-8"
                      />
                    </div>
                  </div>
                  <p className="mt-1 text-right text-xs text-muted-foreground">
                    {formatCurrency(computeLine(l).lineTotal)}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="tabular-nums">{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tax</span>
              <span className="tabular-nums">{formatCurrency(totals.taxTotal)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">Extra discount</span>
              <Input
                type="number"
                step="0.01"
                value={invoiceDiscount}
                onChange={(e) => setInvoiceDiscount(Math.max(0, Number(e.target.value)))}
                className="h-8 w-28 text-right"
              />
            </div>
            <div className="flex items-center justify-between border-t pt-2 text-base font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatCurrency(totals.total)}</span>
            </div>
          </div>

          <Button className="w-full" onClick={checkout} disabled={saving}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            Create invoice
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
