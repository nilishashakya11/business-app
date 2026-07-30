"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Plus, CalendarDays, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/appointments/status-badge";
import { cn, formatTime, toDateInput, startOfWeek } from "@/lib/utils";

export interface CalendarStaff {
  id: string;
  name: string;
  color: string | null;
}
export interface CalendarAppointment {
  id: string;
  customerId: string | null;
  staffId: string | null;
  startTime: string;
  endTime: string;
  status: string;
  customerName: string;
  staffName: string | null;
  staffColor: string | null;
  serviceNames: string[];
}

const START_HOUR = 8;
const END_HOUR = 21;
const HOUR_PX = 64;

export function CalendarClient({
  date,
  initialAppointments,
  staff,
  branchId,
  canCreate,
  canUpdate,
}: {
  date: string; // YYYY-MM-DD
  initialAppointments: CalendarAppointment[];
  staff: CalendarStaff[];
  branchId: string | null;
  canCreate: boolean;
  canUpdate: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "week" ? "week" : "day";

  const current = React.useMemo(() => new Date(date + "T00:00:00"), [date]);

  // ---- live polling window (day or week) ----
  const from = React.useMemo(() => {
    if (view === "day") return new Date(date + "T00:00:00");
    return startOfWeek(current);
  }, [view, date, current]);
  const to = React.useMemo(() => {
    if (view === "day") return new Date(date + "T23:59:59.999");
    return new Date(startOfWeek(current).getTime() + 7 * 86_400_000 - 1);
  }, [view, date, current]);

  const { data: live, isFetching } = useQuery({
    queryKey: ["appointments", branchId, from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const res = await fetch(
        `/api/appointments?branchId=${branchId}&from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`,
      );
      if (!res.ok) throw new Error("Failed to load appointments");
      const json = await res.json();
      // Map the API's nested shape into the flat CalendarAppointment shape.
      type ApiAppt = {
        id: string;
        customerId: string | null;
        staffId: string | null;
        startTime: string;
        endTime: string;
        status: string;
        customer: { firstName: string; lastName: string | null } | null;
        staff: { color: string | null; user: { name: string } } | null;
        services: { service: { name: string } }[];
      };
      return (json.appointments as ApiAppt[]).map((a) => ({
        id: a.id,
        customerId: a.customerId,
        staffId: a.staffId,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
        customerName: a.customer
          ? `${a.customer.firstName} ${a.customer.lastName ?? ""}`.trim()
          : "Walk-in",
        staffName: a.staff?.user.name ?? null,
        staffColor: a.staff?.color ?? null,
        serviceNames: a.services.map((s) => s.service.name),
      })) satisfies CalendarAppointment[];
    },
    enabled: !!branchId,
    initialData: initialAppointments,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  const appointments = live ?? initialAppointments;

  function shift(delta: number) {
    const next = new Date(current);
    next.setDate(next.getDate() + (view === "day" ? delta : delta * 7));
    router.push(`/calendar?view=${view}&date=${toDateInput(next)}`);
  }
  function setView(v: "day" | "week") {
    router.push(`/calendar?view=${v}&date=${date}`);
  }
  function openNewAt(hour: number) {
    if (!canCreate) return;
    const start = new Date(current);
    start.setHours(hour, 0, 0, 0);
    router.push(`/calendar/new?start=${encodeURIComponent(start.toISOString())}&date=${date}`);
  }
  function openEdit(appt: CalendarAppointment) {
    router.push(`/calendar/${appt.id}/edit`);
  }

  const hours = React.useMemo(
    () => Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i),
    [],
  );
  const isToday = toDateInput(new Date()) === date;

  // ---- per-staff columns ----
  const columns = React.useMemo(() => {
    const cols: { staff: CalendarStaff | null; appts: CalendarAppointment[] }[] = staff.map(
      (s) => ({ staff: s, appts: [] }),
    );
    const unassigned = appointments.filter((a) => !a.staffId);
    if (unassigned.length > 0) cols.unshift({ staff: null, appts: unassigned });
    for (const a of appointments) {
      if (!a.staffId) continue;
      const col = cols.find((c) => c.staff?.id === a.staffId);
      if (col) col.appts.push(a);
    }
    for (const c of cols) c.appts.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return cols;
  }, [staff, appointments]);

  function positionFor(appt: CalendarAppointment) {
    const start = new Date(appt.startTime);
    const end = new Date(appt.endTime);
    const startMins = start.getHours() * 60 + start.getMinutes() - START_HOUR * 60;
    const durationMins = Math.max(20, (end.getTime() - start.getTime()) / 60_000);
    return { top: (startMins / 60) * HOUR_PX, height: (durationMins / 60) * HOUR_PX };
  }

  // ---- drag-and-drop reschedule (day view) ----
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dropTarget, setDropTarget] = React.useState<{ staffId: string | null; hour: number } | null>(null);
  const [saving, setSaving] = React.useState(false);

  async function handleDrop(staffId: string | null, hour: number) {
    if (!draggingId || saving) return;
    const appt = appointments.find((a) => a.id === draggingId);
    if (!appt) return;
    const start = new Date(appt.startTime);
    start.setHours(hour, start.getMinutes(), 0, 0);
    setSaving(true);
    try {
      await fetch(`/api/appointments/${appt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime: start.toISOString(), staffId }),
      });
    } finally {
      setSaving(false);
      setDraggingId(null);
      setDropTarget(null);
      router.refresh();
    }
  }

  const weekDays = React.useMemo(() => {
    const wkStart = startOfWeek(current);
    return Array.from({ length: 7 }, (_, i) => new Date(wkStart.getTime() + i * 86_400_000));
  }, [current]);

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
          <Button variant="outline" size="icon" onClick={() => shift(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => shift(1)}>
            <ChevronRight className="size-4" />
          </Button>
          <div className="ml-1">
            <p className="font-display text-lg font-semibold">
              {view === "day"
                ? current.toLocaleDateString("en-NP", { weekday: "long", day: "numeric", month: "long" })
                : `${weekDays[0].toLocaleDateString("en-NP", { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString("en-NP", { month: "short", day: "numeric" })}`}
            </p>
            {!isToday && (
              <button onClick={() => router.push("/calendar")} className="text-xs text-primary hover:underline">
                Jump to today
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFetching && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
          <div className="flex items-center rounded-lg border bg-card p-0.5">
            <button
              onClick={() => setView("day")}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                view === "day" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Day
            </button>
            <button
              onClick={() => setView("week")}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium transition-colors",
                view === "week" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Week
            </button>
          </div>
          {canCreate && (
            <Button onClick={() => openNewAt(Math.max(START_HOUR, new Date().getHours()))}>
              <Plus className="size-4" />
              New appointment
            </Button>
          )}
        </div>
      </div>

      {columns.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No team members yet"
          description="Add team members to this branch to start scheduling."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Header: staff columns */}
              <div className="flex border-b">
                <div className="w-16 shrink-0" />
                {columns.map((c) => (
                  <div
                    key={c.staff?.id ?? "unassigned"}
                    className="flex min-w-[160px] flex-1 flex-col items-center gap-0.5 border-l px-2 py-2"
                  >
                    <span
                      className="flex size-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: c.staff?.color ?? "hsl(var(--muted-foreground))" }}
                    >
                      {c.staff ? c.staff.name.charAt(0) : "?"}
                    </span>
                    <span className="truncate text-xs font-medium">{c.staff?.name ?? "Unassigned"}</span>
                  </div>
                ))}
              </div>

              {view === "day" ? (
                <div className="flex">
                  {/* Hour gutter */}
                  <div className="w-16 shrink-0">
                    {hours.map((h) => (
                      <div key={h} className="relative" style={{ height: HOUR_PX }}>
                        <span className="absolute -top-2 right-2 text-xs text-muted-foreground">
                          {h % 12 === 0 ? 12 : h % 12}
                          {h < 12 ? "am" : "pm"}
                        </span>
                      </div>
                    ))}
                  </div>

                  {columns.map((c) => (
                    <div key={c.staff?.id ?? "unassigned"} className="relative flex-1 border-l">
                      {hours.map((h) => (
                        <div
                          key={h}
                          onClick={() => openNewAt(h)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDropTarget({ staffId: c.staff?.id ?? null, hour: h });
                          }}
                          onDrop={() => handleDrop(c.staff?.id ?? null, dropTarget?.hour ?? h)}
                          className={cn(
                            "border-b border-dashed border-border/60 transition-colors",
                            canCreate && "cursor-pointer hover:bg-muted/40",
                            dropTarget?.staffId === (c.staff?.id ?? null) &&
                              dropTarget?.hour === h &&
                              "bg-primary/10",
                          )}
                          style={{ height: HOUR_PX }}
                        />
                      ))}
                      {c.appts.map((appt) => {
                        const pos = positionFor(appt);
                        const color = appt.staffColor ?? "#a8754e";
                        return (
                          <div
                            key={appt.id}
                            draggable={canUpdate}
                            onDragStart={() => setDraggingId(appt.id)}
                            onClick={() => openEdit(appt)}
                            className="absolute left-1 right-1 cursor-pointer overflow-hidden rounded-md border-l-4 bg-card p-2 text-left shadow-sm transition-shadow hover:shadow-md"
                            style={{
                              top: pos.top,
                              height: pos.height,
                              borderLeftColor: color,
                              backgroundColor: `${color}14`,
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
                              <div className="mt-1">
                                <StatusBadge status={appt.status} className="px-1 py-0 text-[10px]" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  {columns.map((c) => (
                    <div key={c.staff?.id ?? "unassigned"} className="border-t first:border-t-0">
                      <div className="flex items-center border-b bg-muted/30 px-3 py-1.5 text-xs font-medium">
                        <span
                          className="mr-2 size-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: c.staff?.color ?? "hsl(var(--muted-foreground))" }}
                        />
                        {c.staff?.name ?? "Unassigned"}
                      </div>
                      <div className="flex">
                        {weekDays.map((d) => {
                          const dayStr = toDateInput(d);
                          const dayAppts = c.appts.filter(
                            (a) => toDateInput(new Date(a.startTime)) === dayStr,
                          );
                          return (
                            <div
                              key={dayStr}
                              className="min-h-[88px] flex-1 border-l p-1.5 first:border-l-0"
                            >
                              <p className="mb-1 text-center text-[10px] font-medium text-muted-foreground">
                                {d.toLocaleDateString("en-NP", { weekday: "short" })} {d.getDate()}
                              </p>
                              {dayAppts.map((appt) => (
                                <button
                                  key={appt.id}
                                  onClick={() => openEdit(appt)}
                                  className="mb-1 block w-full truncate rounded border-l-2 bg-card px-1.5 py-1 text-left text-[11px] shadow-sm"
                                  style={{ borderLeftColor: appt.staffColor ?? "#a8754e" }}
                                >
                                  <span className="font-medium">{appt.customerName}</span>
                                  <span className="ml-1 text-muted-foreground">
                                    {formatTime(appt.startTime)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
