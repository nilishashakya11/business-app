import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/appointments/status-badge";
import { StarRating } from "@/components/reviews/star-rating";
import { formatDateTime } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { CalendarClock } from "lucide-react";
import { ReviewForm } from "./review-form";

export const metadata = { title: "My bookings — Glow & Go" };

export default async function MyBookingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CLIENT") redirect("/book");

  const customer = await prisma.customer.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      appointments: {
        orderBy: { startTime: "desc" },
        include: {
          branch: { select: { name: true } },
          staff: { select: { user: { select: { name: true } } } },
          services: { include: { service: { select: { name: true, price: true } } } },
          reviews: { select: { id: true, rating: true } },
        },
      },
    },
  });

  const appointments = customer?.appointments ?? [];
  const upcoming = appointments.filter((a) => a.startTime >= new Date() && a.status !== "CANCELLED");
  const past = appointments.filter((a) => a.startTime < new Date() || a.status === "CANCELLED");

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl font-semibold tracking-tight">My bookings</h1>
      <p className="mb-6 text-sm text-muted-foreground">Your upcoming and past appointments.</p>

      {appointments.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="No bookings yet"
          description="Book your first appointment online."
        />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
            ) : (
              <ul className="space-y-3">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
                    <div>
                      <p className="font-medium">
                        {a.services.map((s) => s.service.name).join(", ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(a.startTime)} &middot; {a.branch.name}
                        {a.staff ? ` · with ${a.staff.user.name}` : ""}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Past
            </h2>
            {past.length === 0 ? (
              <p className="text-sm text-muted-foreground">No past appointments yet.</p>
            ) : (
              <ul className="space-y-3">
                {past.map((a) => (
                  <li key={a.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {a.services.map((s) => s.service.name).join(", ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(a.startTime)} &middot; {a.branch.name}
                          {a.staff ? ` · with ${a.staff.user.name}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                    {a.status === "COMPLETED" && (
                      <div className="mt-3 border-t pt-3">
                        {a.reviews.length > 0 ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>Your rating:</span>
                            <StarRating value={a.reviews[0].rating} size={14} />
                          </div>
                        ) : (
                          <ReviewForm appointmentId={a.id} />
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
