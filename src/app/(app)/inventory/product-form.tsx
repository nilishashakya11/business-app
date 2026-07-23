"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { FormPageShell } from "@/components/shell/form-page-shell";

export interface ProductRecord {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  costPrice: number;
  sellPrice: number;
  quantity: number;
  lowStockLevel: number;
  unit: string;
}

export function ProductForm({
  product,
  branchId,
}: {
  product?: ProductRecord | null;
  branchId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const editing = Boolean(product);
  const backHref = "/inventory";

  const [name, setName] = React.useState(product?.name ?? "");
  const [sku, setSku] = React.useState(product?.sku ?? "");
  const [description, setDescription] = React.useState(product?.description ?? "");
  const [costPrice, setCostPrice] = React.useState(product?.costPrice ?? 0);
  const [sellPrice, setSellPrice] = React.useState(product?.sellPrice ?? 0);
  const [quantity, setQuantity] = React.useState(product?.quantity ?? 0);
  const [lowStockLevel, setLowStockLevel] = React.useState(product?.lowStockLevel ?? 5);
  const [unit, setUnit] = React.useState(product?.unit ?? "pcs");
  const [saving, setSaving] = React.useState(false);

  async function save() {
    if (!name.trim()) {
      toast({ title: "Name is required", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const base = {
        name,
        sku: sku || undefined,
        description: description || undefined,
        costPrice,
        sellPrice,
        lowStockLevel,
        unit,
      };
      await apiFetch(editing ? `/api/products/${product!.id}` : "/api/products", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(editing ? base : { ...base, branchId, quantity }),
      });
      toast({ title: editing ? "Product updated" : "Product added", variant: "success" });
      router.push(backHref);
      router.refresh();
    } catch (err) {
      toast({
        title: "Couldn't save product",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <FormPageShell
      title={editing ? "Edit product" : "New product"}
      description={
        editing
          ? "Update product details. Use Adjust stock to change quantity."
          : "Add a retail or consumable product to this branch."
      }
      backHref={backHref}
      actions={
        <>
          <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {editing ? "Save changes" : "Add product"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input id="sku" value={sku} onChange={(e) => setSku(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="costPrice">Cost price</Label>
            <Input
              id="costPrice"
              type="number"
              step="0.01"
              value={costPrice}
              onChange={(e) => setCostPrice(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sellPrice">Sell price</Label>
            <Input
              id="sellPrice"
              type="number"
              step="0.01"
              value={sellPrice}
              onChange={(e) => setSellPrice(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {!editing && (
            <div className="space-y-2">
              <Label htmlFor="quantity">Opening stock</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="lowStock">Low-stock alert</Label>
            <Input
              id="lowStock"
              type="number"
              value={lowStockLevel}
              onChange={(e) => setLowStockLevel(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>
    </FormPageShell>
  );
}
