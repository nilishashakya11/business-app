"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Minus, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const TYPES = [
  { value: "PURCHASE", label: "Purchase / restock" },
  { value: "RETURN", label: "Customer return" },
  { value: "ADJUSTMENT", label: "Manual adjustment" },
  { value: "CONSUMPTION", label: "Internal use" },
];

export function StockDialog({
  open,
  onOpenChange,
  product,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: { id: string; name: string; quantity: number } | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [direction, setDirection] = React.useState<1 | -1>(1);
  const [amount, setAmount] = React.useState(1);
  const [type, setType] = React.useState("PURCHASE");
  const [reason, setReason] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (open) {
      setDirection(1);
      setAmount(1);
      setType("PURCHASE");
      setReason("");
    }
  }, [open]);

  const resulting = product ? product.quantity + direction * amount : 0;

  async function submit() {
    if (!product) return;
    if (amount <= 0) {
      toast({ title: "Enter an amount", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await apiFetch(`/api/products/${product.id}/stock`, {
        method: "POST",
        body: JSON.stringify({ quantity: direction * amount, type, reason }),
      });
      toast({ title: "Stock updated", variant: "success" });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      toast({
        title: "Couldn't adjust stock",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Adjust stock</DialogTitle>
          <DialogDescription>{product?.name}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={direction === 1 ? "default" : "outline"}
              onClick={() => {
                setDirection(1);
                setType("PURCHASE");
              }}
            >
              <Plus className="size-4" />
              Add
            </Button>
            <Button
              type="button"
              variant={direction === -1 ? "default" : "outline"}
              onClick={() => {
                setDirection(-1);
                setType("CONSUMPTION");
              }}
            >
              <Minus className="size-4" />
              Remove
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Quantity</Label>
            <Input
              id="amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(Math.max(1, Number(e.target.value)))}
            />
          </div>

          <div className="space-y-2">
            <Label>Reason</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <div
            className={cn(
              "flex items-center justify-between rounded-lg px-3 py-2 text-sm",
              resulting < 0 ? "bg-destructive/10 text-destructive" : "bg-muted",
            )}
          >
            <span className="text-muted-foreground">New quantity</span>
            <span className="font-semibold tabular-nums">{resulting}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving || resulting < 0}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
