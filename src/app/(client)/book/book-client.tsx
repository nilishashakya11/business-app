"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  Clock,
  MapPin,
  Star,
  CalendarDays,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/api-client";
import { cn, formatCurrency, formatTime, toDateInput } from "@/lib/utils";

export interface BookStaff {
  id: string;
  name: string;
  jobTitle: string | null;
  color: string | null;
}
export interface BookService {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  category: string;
  staff: BookStaff[];
}
export interface BookBranch {
  id: string;
  name: string;
  city: string | null;
  services: BookService[];
}

type Step = "branch" | "service" | "staff" | "time" | "confirm";

export function BookClient({
  branches,
  isSignedInClient,
}: {
  branches: BookBranch[];
  isSignedInClient: boolean;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const [step, setStep] = React.useState<Step>(branches.length === 1 ? "service" : "branch");
  const [branchId, setBranchId] = React.useState(branches.length === 1 ? branches[0].id : "");
  const [serviceId, setServiceId] = React.useState("");
  const [staffId, setStaffId] = React.useState("");
  const [date, setDate] = React.useState(toDateInput(new Date()));
  const [slot, setSlot] = React.useState("");
  const [slots, setSlots] = React.useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Guest details (only used when not signed in as a client)
  const [guestFirst, setGuestFirst] = React.useState("");
  const [guestLast, setGuestLast] = React.useState("");
  const [guestEmail, setGuestEmail] = React.useState("");
  const [guestPhone, setGuestPhone] = React.useState("");

  const branch = branches.find((b) => b.id === branchId) ?? null;
  const service = branch?.services.find((s) => s.id === serviceId) ?? null;
  const staff = service?.staff.find((s) => s.id === staffId) ?? null;

  // Group services by category for the picker.
  const grouped = React.useMemo(() => {
    const map = new Map<string, BookService[]>();
    for (const s of branch?.services ?? []) {
      const arr = map.get(s.category) ?? [];
      arr.push(s);
      map.set(s.category, arr);
    }
    return Array.from(map.entries());
  }, [branch]);

  // Fetch availability whenever we reach the time step (or its inputs change).
  React.useEffect(() => {
    if (step !== "time" || !branchId || !staffId || !service) return;
    let active = true;
    setLoadingSlots(true);
    setSlot("");
    apiFetch<{ slots: string[] }>(
      `/api/availability?branchId=${branchId}&staffId=${staffId}&date=${date}&duration=${service.durationMinutes}`,
    )
      .then((res) => {
        if (active) setSlots(res.slots);
      })
      .catch(() => active && setSlots([]))
      .finally(() => active && setLoadingSlots(false));
    return () => {
      active = false;
    };
  }, [step, branchId, staffId, date, service]);

  async function submit() {
    if (!slot) return;
    setSaving(true);
    try {
      await apiFetch("/api/online-bookings", {
        method: "POST",
        body: JSON.stringify({
          branchId,
          staffId,
          serviceIds: [serviceId],
          startTime: slot,
          guest: isSignedInClient
            ? undefined
            : {
                firstName: guestFirst,
                lastName: guestLast,
                email: guestEmail,
                phone: guestPhone,
              },
        }),
      });
      toast({ title: "Appointment booked!", variant: "success" });
      if (isSignedInClient) {
        router.push("/my-bookings");
      } else {
        router.push("/login");
      }
      router.refresh();
    } catch (err) {
      toast({
        title: "Couldn't complete booking",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
      setSaving(false);
    }
  }

  const canConfirm = isSignedInClient || guestFirst.trim().length > 0;

  return (
    <div className="mx-auto max-w-2xl">
      <StepIndicator step={step} multiBranch={branches.length > 1} />

      <div className="mt-6 rounded-2xl border bg-card p-6">
        {/* Step: branch */}
        {step === "branch" && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Choose a location</h2>
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setBranchId(b.id);
                  setServiceId("");
                  setStaffId("");
                  setStep("service");
                }}
                className="flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-accent"
              >
                <div>
                  <p className="font-medium">{b.name}</p>
                  {b.city && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="size-3.5" />
                      {b.city}
                    </p>
                  )}
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {/* Step: service */}
        {step === "service" && branch && (
          <div className="space-y-5">
            <h2 className="font-display text-lg font-semibold">Select a service</h2>
            {grouped.length === 0 && (
              <p className="text-sm text-muted-foreground">No services available at this location.</p>
            )}
            {grouped.map(([cat, list]) => (
              <div key={cat} className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {cat}
                </h3>
                {list.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setServiceId(s.id);
                      setStaffId("");
                      setStep("staff");
                    }}
                    disabled={s.staff.length === 0}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors",
                      s.staff.length === 0
                        ? "cursor-not-allowed opacity-50"
                        : "hover:border-primary hover:bg-accent",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{s.name}</p>
                      <p className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="size-3.5" />
                        {s.durationMinutes} min
                        {s.staff.length === 0 && " · no team member available"}
                      </p>
                    </div>
                    <span className="ml-3 shrink-0 font-semibold">{formatCurrency(s.price)}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Step: staff */}
        {step === "staff" && service && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-semibold">Choose a team member</h2>
            {service.staff.map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setStaffId(st.id);
                  setStep("time");
                }}
                className="flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-colors hover:border-primary hover:bg-accent"
              >
                <span
                  className="flex size-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: st.color ?? "hsl(var(--primary))" }}
                >
                  {st.name.charAt(0)}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{st.name}</p>
                  {st.jobTitle && <p className="text-sm text-muted-foreground">{st.jobTitle}</p>}
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        )}

        {/* Step: time */}
        {step === "time" && service && staff && (
          <div className="space-y-4">
            <h2 className="font-display text-lg font-semibold">Pick a time</h2>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <div className="relative">
                <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="date"
                  type="date"
                  min={toDateInput(new Date())}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                <Loader2 className="mr-2 size-4 animate-spin" />
                Finding available times…
              </div>
            ) : slots.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No open slots on this day. Try another date.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlot(s)}
                    className={cn(
                      "rounded-lg border py-2 text-sm font-medium transition-colors",
                      slot === s
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-primary hover:bg-accent",
                    )}
                  >
                    {formatTime(s)}
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end">
              <Button onClick={() => setStep("confirm")} disabled={!slot}>
                Continue
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step: confirm */}
        {step === "confirm" && service && staff && (
          <div className="space-y-5">
            <h2 className="font-display text-lg font-semibold">Confirm your booking</h2>
            <div className="space-y-2 rounded-xl bg-muted/50 p-4 text-sm">
              <Row label="Service" value={service.name} />
              <Row label="With" value={staff.name} />
              <Row label="When" value={`${new Date(slot).toDateString()} · ${formatTime(slot)}`} />
              <Row label="Duration" value={`${service.durationMinutes} min`} />
              <div className="mt-2 flex justify-between border-t pt-2 text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(service.price)}</span>
              </div>
            </div>

            {!isSignedInClient && (
              <div className="space-y-3">
                <p className="text-sm font-medium">Your details</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="First name" value={guestFirst} onChange={(e) => setGuestFirst(e.target.value)} />
                  <Input placeholder="Last name" value={guestLast} onChange={(e) => setGuestLast(e.target.value)} />
                </div>
                <Input placeholder="Email" type="email" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
                <Input placeholder="Phone" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                <p className="text-xs text-muted-foreground">
                  Booking as a guest. <a href="/client/signup" className="text-primary hover:underline">Create an account</a> to manage your bookings.
                </p>
              </div>
            )}

            <Button className="w-full" onClick={submit} disabled={saving || !canConfirm}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Star className="size-4" />}
              Confirm booking
            </Button>
          </div>
        )}
      </div>

      {/* Back navigation */}
      {step !== "branch" && step !== (branches.length === 1 ? "service" : "branch") && (
        <div className="mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const order: Step[] = ["branch", "service", "staff", "time", "confirm"];
              const idx = order.indexOf(step);
              const prev = order[Math.max(0, idx - 1)];
              setStep(branches.length === 1 && prev === "branch" ? "service" : prev);
            }}
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

function StepIndicator({ step, multiBranch }: { step: Step; multiBranch: boolean }) {
  const all: { key: Step; label: string }[] = [
    ...(multiBranch ? [{ key: "branch" as Step, label: "Location" }] : []),
    { key: "service", label: "Service" },
    { key: "staff", label: "Team" },
    { key: "time", label: "Time" },
    { key: "confirm", label: "Confirm" },
  ];
  const currentIdx = all.findIndex((s) => s.key === step);
  return (
    <ol className="flex items-center gap-2">
      {all.map((s, i) => (
        <li key={s.key} className="flex flex-1 items-center gap-2">
          <div
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
              i < currentIdx
                ? "bg-primary text-primary-foreground"
                : i === currentIdx
                  ? "bg-primary/15 text-primary ring-2 ring-primary"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {i < currentIdx ? <Check className="size-3.5" /> : i + 1}
          </div>
          {i < all.length - 1 && (
            <div className={cn("h-px flex-1", i < currentIdx ? "bg-primary" : "bg-border")} />
          )}
        </li>
      ))}
    </ol>
  );
}
