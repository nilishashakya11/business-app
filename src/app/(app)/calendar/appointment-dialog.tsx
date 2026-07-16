"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2, Check } from "lucide-react";
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

export function AppointmentDialog({
  open,
  onOpenChange,
  branchId,
  services,
  staff,
  customers,
  appointment,
  defaultStart,
  canDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  services: ServiceOption[];
  staff: StaffOption[];
  customers: CustomerOption[];
  appointment?: AppointmentEditable | null;
  defaultStart?: Date | null;
  canDelete: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const editing = Boolean(appointment);

  const [customerId, setCustomerId] = React.useState<string>("");
  const [staffId, setStaffId] = React.useState<string>("");
  const [startTime, setStartTime] = React.useState<string>("");
  const [selectedServices, setSelectedServices] = React.useState<string[]>([]);
  const [notes, setNotes] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setCustomerId(appointment?.customerId ?? "");
    setStaffId(appointment?.staffId ?? "");
    setStartTime(
      appointment?.startTime
        ? toLocalInput(new Date(appointment.startTime))
        : defaultStart
          ? toLocalInput(defaultStart)
          : toLocalInput(new Date()),
    );
    setSelectedServices(appointment?.serviceIds ?? []);
    setNotes(appointment?.notes ?? "");
  }, [open, appointment, defaultStart]);

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
      onOpenChange(false);
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
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit appointment" : "New appointment"}</DialogTitle>
          <DialogDescription>Book services with a team member for a customer.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
            <div className="max-h-48 space-y-1 overflow-y-auto scroll-thin rounded-lg border p-1">
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

        <DialogFooter className="sm:justify-between">
          {editing && canDelete ? (
            <Button type="button" variant="ghost" onClick={remove} disabled={saving}>
              <Trash2 className="size-4" />
              Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {editing ? "Save changes" : "Book appointment"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
