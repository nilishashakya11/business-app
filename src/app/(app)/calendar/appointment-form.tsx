"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Check, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { cn, formatCurrency } from "@/lib/utils";
import { FormPageShell } from "@/components/shell/form-page-shell";

export interface ServiceOption {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
}
export interface StaffOption {
  id: string;
  name: string;
}
export interface CustomerOption {
  id: string;
  name: string;
}

export interface AppointmentEditable {
  id: string;
  customerId: string | null;
  staffId: string | null;
  startTime: string;
  notes: string | null;
  serviceIds: string[];
}

/** Convert a Date to the `YYYY-MM-DDTHH:mm` string a datetime-local input expects. */
function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function AppointmentForm({
  branchId,
  services,
  staff,
  customers,
  appointment,
  defaultStart,
  backHref,
  canDelete,
}: {
  branchId: string;
  services: ServiceOption[];
  staff: StaffOption[];
  customers: CustomerOption[];
  appointment?: AppointmentEditable | null;
  defaultStart?: string | null;
  backHref: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const editing = Boolean(appointment);

  // Local, mutable copy so a quick-added client shows up immediately.
  const [customerList, setCustomerList] = React.useState<CustomerOption[]>(customers);
  const [customerId, setCustomerId] = React.useState(appointment?.customerId ?? "");
  const [staffId, setStaffId] = React.useState(appointment?.staffId ?? "");

  // Quick-add client state
  const [addingClient, setAddingClient] = React.useState(false);
  const [newFirst, setNewFirst] = React.useState("");
  const [newLast, setNewLast] = React.useState("");
  const [newPhone, setNewPhone] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [creatingClient, setCreatingClient] = React.useState(false);

  const [startTime, setStartTime] = React.useState(
    appointment?.startTime
      ? toLocalInput(new Date(appointment.startTime))
      : defaultStart
        ? toLocalInput(new Date(defaultStart))
        : toLocalInput(new Date()),
  );
  const [selectedServices, setSelectedServices] = React.useState<string[]>(
    appointment?.serviceIds ?? [],
  );
  const [notes, setNotes] = React.useState(appointment?.notes ?? "");
  const [saving, setSaving] = React.useState(false);

  const toggleService = (id: string) =>
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );

  const summary = React.useMemo(() => {
    const chosen = services.filter((s) => selectedServices.includes(s.id));
    return {
      minutes: chosen.reduce((sum, s) => sum + s.durationMinutes, 0),
      total: chosen.reduce((sum, s) => sum + s.price, 0),
    };
  }, [selectedServices, services]);

  async function save() {
    if (selectedServices.length === 0) {
      toast({ title: "Select at least one service", variant: "error" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        branchId,
        customerId: customerId || null,
        staffId: staffId || null,
        startTime: new Date(startTime).toISOString(),
        serviceIds: selectedServices,
        notes,
      };
      await apiFetch(editing ? `/api/appointments/${appointment!.id}` : "/api/appointments", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      toast({ title: editing ? "Appointment updated" : "Appointment booked", variant: "success" });
      router.push(backHref);
      router.refresh();
    } catch (err) {
      toast({
        title: "Couldn't save appointment",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!appointment) return;
    setSaving(true);
    try {
      await apiFetch(`/api/appointments/${appointment.id}`, { method: "DELETE" });
      toast({ title: "Appointment deleted", variant: "success" });
      router.push(backHref);
      router.refresh();
    } catch (err) {
      toast({
        title: "Couldn't delete",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function createClient() {
    if (newFirst.trim().length === 0) {
      toast({ title: "Enter the client's first name", variant: "error" });
      return;
    }
    setCreatingClient(true);
    try {
      const { customer } = await apiFetch<{ customer: { id: string; firstName: string; lastName: string | null } }>(
        "/api/customers",
        {
          method: "POST",
          body: JSON.stringify({
            firstName: newFirst,
            lastName: newLast || undefined,
            phone: newPhone || undefined,
            email: newEmail || undefined,
          }),
        },
      );
      const name = `${customer.firstName} ${customer.lastName ?? ""}`.trim();
      // Add to the list and select it so booking continues uninterrupted.
      setCustomerList((prev) => [{ id: customer.id, name }, ...prev]);
      setCustomerId(customer.id);
      setAddingClient(false);
      setNewFirst("");
      setNewLast("");
      setNewPhone("");
      setNewEmail("");
      toast({ title: "Client added", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't add client",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setCreatingClient(false);
    }
  }

  return (
    <FormPageShell
      title={editing ? "Edit appointment" : "New appointment"}
      description="Book services with a team member for a customer."
      backHref={backHref}
      actions={
        <>
          {editing && canDelete && (
            <Button type="button" variant="ghost" onClick={remove} disabled={saving}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => router.push(backHref)}>
            Cancel
          </Button>
          <Button type="button" onClick={save} disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {editing ? "Save changes" : "Book appointment"}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Customer</Label>
              <button
                type="button"
                onClick={() => setAddingClient((v) => !v)}
                className="text-xs font-medium text-primary hover:underline"
              >
                {addingClient ? "Cancel" : "+ New client"}
              </button>
            </div>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Walk-in" />
              </SelectTrigger>
              <SelectContent>
                {customerList.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Team member</Label>
            <Select value={staffId} onValueChange={setStaffId}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quick-add client — create a new client inline without leaving booking */}
        {addingClient && (
          <div className="space-y-3 rounded-lg border border-dashed bg-muted/30 p-3">
            <p className="text-xs font-medium text-muted-foreground">Add a new client</p>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="First name" value={newFirst} onChange={(e) => setNewFirst(e.target.value)} />
              <Input placeholder="Last name" value={newLast} onChange={(e) => setNewLast(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} />
              <Input placeholder="Email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
            </div>
            <Button type="button" size="sm" onClick={createClient} disabled={creatingClient}>
              {creatingClient ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              Add &amp; select
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input
            id="startTime"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Services</Label>
          <div className="space-y-1 rounded-lg border p-1">
            {services.length === 0 && (
              <p className="p-3 text-sm text-muted-foreground">
                No active services for this branch.
              </p>
            )}
            {services.map((s) => {
              const active = selectedServices.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleService(s.id)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors",
                    active ? "bg-accent" : "hover:bg-muted",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-4 items-center justify-center rounded border",
                        active && "border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {active && <Check className="size-3" />}
                    </span>
                    {s.name}
                    <span className="text-xs text-muted-foreground">{s.durationMinutes}m</span>
                  </span>
                  <span className="tabular-nums">{formatCurrency(s.price)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedServices.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
            <span className="text-muted-foreground">{summary.minutes} minutes total</span>
            <span className="font-semibold">{formatCurrency(summary.total)}</span>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
    </FormPageShell>
  );
}
