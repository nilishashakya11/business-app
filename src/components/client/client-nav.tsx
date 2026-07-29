"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { CalendarClock, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ClientNav({ user }: { user: { name: string; role: string } | null }) {
  const pathname = usePathname();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/client/signup">Sign up</Link>
        </Button>
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1">
      <Link
        href="/my-bookings"
        className={cn(
          "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
          pathname.startsWith("/my-bookings")
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <CalendarClock className="size-4" />
        My bookings
      </Link>
      <Button variant="ghost" size="sm" onClick={() => signOut({ callbackUrl: "/login" })}>
        <LogOut className="size-4" />
        Sign out
      </Button>
    </nav>
  );
}
