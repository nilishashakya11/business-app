"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Pencil, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";

export interface BranchRecord {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  staffCount: number;
}

export function BranchesManager({ branches }: { branches: BranchRecord[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<BranchRecord | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [form, setForm] = React.useState({
    name: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    isActive: true,
  });

  function openNew() {
    setEditing(null);
    setForm({ name: "", address: "", city: "", phone: "", email: "", isActive: true });
    setOpen(true);
  }

  function openEdit(b: BranchRecord) {
    setEditing(b);
    setForm({
      name: b.name,
      address: b.address ?? "",
      city: b.city ?? "",
      phone: b.phone ?? "",
      email: b.email ?? "",
      isActive: b.isActive,
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const body = JSON.stringify({
        name: form.name,
        address: form.address || undefined,
        city: form.city || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        isActive: form.isActive,
      });
      if (editing) {
        await apiFetch(`/api/branches/${editing.id}`, { method: "PATCH", body });
      } else {
        await apiFetch("/api/branches", { method: "POST", body });
      }
      toast({ title: editing ? "Branch updated" : "Branch created", variant: "success" });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast({
        title: "Could not save",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={openNew}>
          <Plus className="size-4" />
          New branch
        </Button>
      </div>

      {branches.length === 0 ? (
        <EmptyState icon={Store} title="No branches yet" description="Add your first location." />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {branches.map((b) => (
            <Card key={b.id}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{b.name}</p>
                    {!b.isActive && <Badge variant="secondary">Inactive</Badge>}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">
                    {[b.address, b.city].filter(Boolean).join(", ") || "No address"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {b.staffCount} staff · {b.phone ?? "no phone"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={() => openEdit(b)}>
                  <Pencil className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit branch" : "New branch"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="b-name">Name</Label>
              <Input
                id="b-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="b-address">Address</Label>
                <Input
                  id="b-address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-city">City</Label>
                <Input
                  id="b-city"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="b-phone">Phone</Label>
                <Input
                  id="b-phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="b-email">Email</Label>
                <Input
                  id="b-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
            </div>
            {editing && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">Active</p>
                  <p className="text-xs text-muted-foreground">
                    Inactive branches are hidden from booking and switching.
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm({ ...form, isActive: v })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Create branch"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
