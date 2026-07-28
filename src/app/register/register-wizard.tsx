"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, AlertCircle, ArrowLeft, ArrowRight, Plus, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api-client";

interface StarterService {
  name: string;
  durationMinutes: number;
  price: number;
}

const STEPS = ["Your account", "Business", "Location", "Services"] as const;

export function RegisterWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Step 1 — owner account
  const [ownerName, setOwnerName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  // Step 2 — business
  const [businessName, setBusinessName] = React.useState("");
  // Step 3 — first location
  const [branchName, setBranchName] = React.useState("Main location");
  const [address, setAddress] = React.useState("");
  const [city, setCity] = React.useState("");
  const [branchPhone, setBranchPhone] = React.useState("");
  // Step 4 — starter services
  const [services, setServices] = React.useState<StarterService[]>([]);

  function next() {
    setError(null);
    // Lightweight per-step validation.
    if (step === 0) {
      if (ownerName.trim().length < 2) return setError("Enter your name");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError("Enter a valid email");
      if (password.length < 8) return setError("Password must be at least 8 characters");
    }
    if (step === 1 && businessName.trim().length < 2) return setError("Enter your business name");
    if (step === 2 && branchName.trim().length < 1) return setError("Enter a location name");
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  function addService() {
    setServices((prev) => [...prev, { name: "", durationMinutes: 30, price: 0 }]);
  }
  function updateService(i: number, patch: Partial<StarterService>) {
    setServices((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function removeService(i: number) {
    setServices((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      await apiFetch("/api/auth/register-business", {
        method: "POST",
        body: JSON.stringify({
          ownerName,
          email,
          password,
          phone,
          businessName,
          branchName,
          address,
          city,
          branchPhone,
          services: services.filter((s) => s.name.trim().length > 0),
        }),
      });
      const res = await signIn("credentials", { email, password, redirect: false });
      if (res?.error) {
        router.push("/login");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm">
      {/* Stepper */}
      <ol className="mb-6 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                i < step
                  ? "bg-primary text-primary-foreground"
                  : i === step
                    ? "bg-primary/15 text-primary ring-2 ring-primary"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {i < step ? <Check className="size-3.5" /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-px flex-1", i < step ? "bg-primary" : "bg-border")} />
            )}
          </li>
        ))}
      </ol>

      <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Step {step + 1} of {STEPS.length}
      </div>
      <h1 className="mb-5 font-display text-xl font-semibold tracking-tight">{STEPS[step]}</h1>

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 0 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ownerName">Your name</Label>
            <Input id="ownerName" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} placeholder="Owner name" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@business.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+977-98..." />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business name</Label>
            <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Serenity Spa" />
          </div>
          <p className="text-sm text-muted-foreground">
            Currency (NPR) and timezone (Asia/Kathmandu) can be changed later in Settings.
          </p>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branchName">Location name</Label>
            <Input id="branchName" value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="Main location" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address">Address (optional)</Label>
              <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City (optional)</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="branchPhone">Location phone (optional)</Label>
            <Input id="branchPhone" value={branchPhone} onChange={(e) => setBranchPhone(e.target.value)} />
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Add a few services to get started — you can always add more later. This step is optional.
          </p>
          <div className="space-y-2">
            {services.map((s, i) => (
              <div key={i} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={s.name}
                    onChange={(e) => updateService(i, { name: e.target.value })}
                    placeholder="Service name"
                    className="h-9"
                  />
                  <button
                    type="button"
                    onClick={() => removeService(i)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-muted-foreground">Duration (min)</span>
                    <Input
                      type="number"
                      min={5}
                      value={s.durationMinutes}
                      onChange={(e) => updateService(i, { durationMinutes: Number(e.target.value) })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground">Price</span>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={s.price}
                      onChange={(e) => updateService(i, { price: Number(e.target.value) })}
                      className="h-9"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={addService} className="w-full">
            <Plus className="size-4" />
            Add a service
          </Button>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between gap-2">
        {step > 0 ? (
          <Button type="button" variant="ghost" onClick={back} disabled={loading}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={next}>
            Continue
            <ArrowRight className="size-4" />
          </Button>
        ) : (
          <Button type="button" onClick={submit} disabled={loading}>
            {loading && <Loader2 className="size-4 animate-spin" />}
            {loading ? "Creating..." : "Create business"}
          </Button>
        )}
      </div>
    </div>
  );
}
