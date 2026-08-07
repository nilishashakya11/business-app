import Link from "next/link";
import { MapPin, ArrowRight, Sparkles } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { initials } from "@/lib/utils";

export const metadata = { title: "Find a business to book — Glow & Go" };

export default async function BookDirectoryPage() {
  // List every business that has at least one active branch and bookable service.
  const businesses = await prisma.business.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      tagline: true,
      logoUrl: true,
      branches: {
        where: { isActive: true },
        select: { city: true, _count: { select: { services: true } } },
      },
    },
  });

  const listed = businesses.filter((b) => b.branches.some((br) => br._count.services > 0));

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Book an appointment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose a business to see its services and available times.
        </p>
      </div>

      {listed.length === 0 ? (
        <p className="text-sm text-muted-foreground">No businesses are taking online bookings yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listed.map((b) => {
            const cities = Array.from(new Set(b.branches.map((br) => br.city).filter(Boolean)));
            return (
              <Link
                key={b.id}
                href={`/book/${b.slug}`}
                className="group flex items-center gap-4 rounded-2xl border bg-card p-5 transition-all hover:border-primary hover:shadow-sm"
              >
                <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-accent text-accent-foreground">
                  {b.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.logoUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="font-display text-lg font-bold">{initials(b.name)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-base font-semibold">{b.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {b.tagline ?? "Book online"}
                  </p>
                  {cities.length > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3" />
                      {cities.join(", ")}
                    </p>
                  )}
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            );
          })}
        </div>
      )}

      <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Sparkles className="size-3.5" />
        Powered by Glow &amp; Go
      </p>
    </div>
  );
}
