import { Suspense } from "react";
import { LoginForm } from "./login-form";
import { CalendarCheck, TrendingUp, Users } from "lucide-react";

export const metadata = { title: "Sign in — Glow & Go" };

export default function LoginPage() {
  return (
    <main className="grid min-h-[100dvh] w-full lg:grid-cols-[1.1fr_1fr]">
      {/* Left: brand / narrative panel (hidden on mobile) */}
      <section className="relative hidden overflow-hidden bg-foreground p-12 text-background lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 top-1/3 size-96 rounded-full bg-primary/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 bottom-0 size-72 rounded-full bg-primary/10 blur-3xl"
        />

        <div className="relative flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-display text-lg font-bold">G</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Glow &amp; Go</span>
        </div>

        <div className="relative max-w-md space-y-8">
          <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight">
            Run the floor, not the paperwork.
          </h1>
          <ul className="space-y-5">
            {[
              { icon: CalendarCheck, text: "Every chair, every booking, one calendar." },
              { icon: TrendingUp, text: "Revenue and commissions calculated as you close." },
              { icon: Users, text: "Team schedules and payroll that keep themselves current." },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3">
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-background/10">
                  <Icon className="size-4 text-primary" strokeWidth={1.5} />
                </div>
                <p className="text-sm leading-relaxed text-background/70">{text}</p>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-background/40">
          Thamel &amp; Lalitpur &middot; Kathmandu Valley
        </p>
      </section>

      {/* Right: sign-in form */}
      <section className="flex items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="font-display text-lg font-bold">G</span>
              </div>
              <span className="font-display text-lg font-semibold tracking-tight">
                Glow &amp; Go
              </span>
            </div>
          </div>

          <div className="mb-8 space-y-1.5">
            <h2 className="font-display text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Sign in to reach your dashboard and today&apos;s schedule.
            </p>
          </div>

          <Suspense fallback={<div className="h-64" />}>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
