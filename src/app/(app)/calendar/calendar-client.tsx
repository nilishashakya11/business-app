"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/appointments/status-badge";
import { cn, formatTime, formatDate } from "@/lib/utils";
import {
  AppointmentDialog,
  type ServiceOption,
  type StaffOption,
  type CustomerOption,
  type AppointmentEditable,
} from "./appointment-dialog";

export interface CalendarAppointment {
  id: string;
  customerId: string | null;
  staffId: string | null;
  startTime: string;
  endTime: string;
  status: string;
  notes: string | null;
  customerName: string;
  staffName: string | null;
  staffColor: string | null;
  serviceNames: string[];
  serviceIds: string[];
}

const START_HOUR = 8;
const END_HOUR = 21;
const HOUR_PX = 64;

export function CalendarClient({
  date,
  appointments,
  services,
  staff,
  customers,
  branchId,
  canCreate,
  canDelete,
}: {
  date: string; // YYYY-MM-DD
  appointments: CalendarAppointment[];
  services: ServiceOption[];
  staff: StaffOption[];
  customers: CustomerOption[];
  branchId: string | null;
  canCreate: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<AppointmentEditable | null>(null);
  const [defaultStart, setDefaultStart] = React.useState<Date | null>(null);

  const current = React.useMemo(() => new Date(date + "T00:00:00"), [date]);

  function shiftDay(delta: number) {
    const next = new Date(current);
    next.setDate(next.getDate() + delta);
    const iso = next.toISOString().slice(0, 10);
    router.push(`/calendar?date=${iso}`);
  }

  function openNewAt(hour: number) {
    if (!canCreate) return;
    const start = new Date(current);
    start.setHours(hour, 0, 0, 0);
    setEditing(null);
    setDefaultStart(start);
    setDialogOpen(true);
  }

  function openEdit(appt: CalendarAppointment) {
    setEditing({
      id: appt.id,
      customerId: appt.customerId,
      staffId: appt.staffId,
      startTime: appt.startTime,
      notes: appt.notes,
      serviceIds: appt.serviceIds,
    });
    setDefaultStart(null);
    setDialogOpen(true);
  }

  const hours = React.useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i),
    [],
  );

  const isToday = new Date().toISOString().slice(0, 10) === date;

  function positionFor(appt: CalendarAppointment) {
    const start = new Date(appt.startTime);
    const end = new Date(appt.endTime);
    const startMins = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
    const durationMins = Math.max(20, (end.getTime() - start.getTime()) / 60_000);
    return {
      top: (startMins / 60) * HOUR_PX,
      height: (durationMins / 60) * HOUR_PX,
    };
  }

  if (!branchId) {
    return (
      <EmptyState
        icon={CalendarDays}
        title="No branch selected"
        description="Select a branch from the top bar to view its calendar."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shiftDay(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => shiftDay(1)}>
            <ChevronRight className="size-4" />
          </Button>
          <div className="ml-1">
            <p className="font-display text-lg font-semibold">
              {formatDate(current, { weekday: "long", day: "numeric", month: "long" })}
            </p>
            {!isToday && (
              <button
                onClick={() => router.push("/calendar")}
                className="text-xs text-primary hover:underline"
              >
                Jump to today
              </button>
            )}
          </div>
        </div>
        {canCreate && (
          <Button onClick={() => openNewAt(Math.max(START_HOUR, new Date().getHours()))}>
            <Plus className="size-4" />
            New appointment
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="relative flex">
          {/* Hour gutter */}
          <div className="w-16 shrink-0 border-r">
            {hours.map((h) => (
              <div
                key={h}
                className="relative text-right"
                style={{ height: HOUR_PX }}
              >
                <span className="absolute -top-2 right-2 text-xs text-muted-foreground">
                  {h % 12 === 0 ? 12 : h % 12}
                  {h < 12 ? "am" : "pm"}
                </span>
              </div>
            ))}
          </div>

          {/* Day column */}
          <div className="relative flex-1">
            {hours.map((h) => (
              <div
                key={h}
                onClick={() => openNewAt(h)}
                className={cn(
                  "border-b border-dashed border-border/60 transition-colors",
                  canCreate && "cursor-pointer hover:bg-muted/40",
                )}
                style={{ height: HOUR_PX }}
              />
            ))}

            {appointments.map((appt) => {
              const pos = positionFor(appt);
              const color = appt.staffColor ?? "#8b5cf6";
              return (
                <button
                  key={appt.id}
                  onClick={() => openEdit(appt)}
                  className="absolute left-1 right-1 overflow-hidden rounded-md border-l-4 bg-card p-2 text-left shadow-sm transition-shadow hover:shadow-md"
                  style={{
                    top: pos.top,
                    height: pos.height,
                    borderLeftColor: color,
                    backgroundColor: `${color}12`,
                  }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="truncate text-xs font-semibold">{appt.customerName}</span>
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {formatTime(appt.startTime)}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {appt.serviceNames.join(", ") || "No services"}
                  </p>
                  {pos.height > 52 && (
                    <div className="mt-1 flex items-center gap-1">
                      <StatusBadge status={appt.status} className="px-1 py-0 text-[10px]" />
                      {appt.staffName && (
                        <span className="truncate text-[10px] text-muted-foreground">
                          {appt.staffName}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {branchId && (
        <AppointmentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          branchId={branchId}
          services={services}
          staff={staff}
          customers={customers}
          appointment={editing}
          defaultStart={defaultStart}
          canDelete={canDelete}
        />
      )}
    </div>
  );
}
