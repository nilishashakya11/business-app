import Link from "next/link";
import { Suspense } from "react";
import { RegisterWizard } from "./register-wizard";

export const metadata = { title: "Register your business — Glow & Go" };

export default function RegisterPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-lg">
        <Link href="/choose" className="mb-8 flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="font-display text-lg font-bold">G</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight">Glow &amp; Go</span>
        </Link>

        <Suspense fallback={<div className="h-96" />}>
          <RegisterWizard />
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
