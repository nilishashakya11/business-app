import Link from "next/link";
import { Suspense } from "react";
import { ClientSignupForm } from "./client-signup-form";

export const metadata = { title: "Create client account — Glow & Go" };

export default function ClientSignupPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <Link href="/choose" className="mb-8 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-display text-lg font-bold">G</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Glow &amp; Go</span>
        </Link>

        <div className="mb-8 space-y-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Create your client account
          </h1>
          <p className="text-sm text-muted-foreground">
            Book appointments online and manage them anytime.
          </p>
        </div>

        <Suspense fallback={<div className="h-64" />}>
          <ClientSignupForm />
        </Suspense>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
