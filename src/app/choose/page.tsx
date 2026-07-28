import Link from "next/link";
import { Store, CalendarHeart, ArrowRight } from "lucide-react";

export const metadata = { title: "Get started — Glow & Go" };

export default function ChoosePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-6 py-12">
      <div className="mb-10 flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <span className="font-display text-lg font-bold">G</span>
        </div>
        <span className="font-display text-lg font-semibold tracking-tight">Glow &amp; Go</span>
      </div>

      <div className="mb-8 max-w-md text-center">
        <h1 className="font-display text-3xl font-semibold tracking-tight">
          How would you like to start?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose the option that describes you. You can always sign in later.
        </p>
      </div>

      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
        <Link
          href="/register"
          className="group flex flex-col rounded-2xl border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-sm"
        >
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <Store className="size-5" strokeWidth={1.75} />
          </div>
          <h2 className="font-display text-lg font-semibold">I want to register my business</h2>
          <p className="mt-1.5 flex-1 text-sm text-muted-foreground">
            Set up your salon, spa or clinic — add services, team members and working hours, and
            start taking bookings.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
            Register business
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <Link
          href="/client/signup"
          className="group flex flex-col rounded-2xl border bg-card p-6 text-left transition-all hover:border-primary hover:shadow-sm"
        >
          <div className="mb-4 flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground">
            <CalendarHeart className="size-5" strokeWidth={1.75} />
          </div>
          <h2 className="font-display text-lg font-semibold">I&apos;m a client</h2>
          <p className="mt-1.5 flex-1 text-sm text-muted-foreground">
            Create a free account to browse services, pick your favourite team member and book
            appointments online in seconds.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
            Create client account
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
