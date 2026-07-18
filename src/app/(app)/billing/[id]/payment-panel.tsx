"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Wallet } from "lucide-react";
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
import { formatCurrency } from "@/lib/utils";

const METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "CARD", label: "Card" },
  { value: "ESEWA", label: "eSewa" },
  { value: "KHALTI", label: "Khalti" },
  { value: "FONEPAY", label: "Fonepay" },
  { value: "IMEPAY", label: "IME Pay" },
  { value: "BANK_TRANSFER", label: "Bank transfer" },
  { value: "COMPLIMENTARY", label: "Complimentary" },
];

export function PaymentPanel({
  invoiceId,
  outstanding,
}: {
  invoiceId: string;
  outstanding: number;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [amount, setAmount] = React.useState(outstanding);
  const [method, setMethod] = React.useState("CASH");
  const [saving, setSaving] = React.useState(false);

  async function record() {
    if (amount <= 0) {
      toast({ title: "Enter an amount", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/payments", {
        method: "POST",
        body: JSON.stringify({ invoiceId, amount, method }),
      });
      toast({ title: "Payment recorded", variant: "success" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Couldn't record payment",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
        <span className="text-muted-foreground">Outstanding</span>
        <span className="font-semibold tabular-nums">{formatCurrency(outstanding)}</span>
      </div>
      <div className="space-y-2">
        <Label htmlFor="amount">Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
        />
      </div>
      <div className="space-y-2">
        <Label>Method</Label>
        <Select value={method} onValueChange={setMethod}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {METHODS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" onClick={record} disabled={saving}>
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Wallet className="size-4" />}
        Record payment
      </Button>
    </div>
  );
}
