import Link from "next/link";
import { auth } from "@/lib/auth";
import { ClientNav } from "@/components/client/client-nav";

/**
 * Public/client-facing shell — a light top-nav layout used for the online
 * booking portal and a signed-in client's bookings. No business back-office UI.
 */
export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user
    ? { name: session.user.name ?? "Account", role: session.user.role }
    : null;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-card/80 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4">
          <Link href="/book" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="font-display text-base font-bold">G</span>
            </div>
            <span className="font-display text-base font-semibold tracking-tight">Glow &amp; Go</span>
          </Link>
          <ClientNav user={user} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Glow &amp; Go &middot; Book beauty &amp; wellness appointments online
      </footer>
    </div>
  );
}
