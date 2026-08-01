import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil, Clock, Users } from "lucide-react";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StarRating } from "@/components/reviews/star-rating";
import { formatCurrency, formatDate, initials } from "@/lib/utils";

export const metadata = { title: "Service — Glow & Go" };

export default async function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.SERVICE_VIEW)) redirect("/dashboard");
  const { branchId } = await resolveActiveBranch(ctx);
  const { id } = await params;

  const service = await prisma.service.findFirst({
    where: { id, ...(branchId ? { branchId } : {}) },
    include: {
      category: { select: { name: true } },
      staff: {
        include: {
          staff: {
            select: {
              id: true,
              jobTitle: true,
              color: true,
              user: { select: { name: true } },
            },
          },
        },
      },
    },
  });
  if (!service) notFound();

  const staffIds = service.staff.map((s) => s.staff.id);

  // Average rating per staff member offering this service.
  const ratings = staffIds.length
    ? await prisma.review.groupBy({
        by: ["staffId"],
        where: { staffId: { in: staffIds }, status: "APPROVED" },
        _avg: { rating: true },
        _count: true,
      })
    : [];
  const ratingByStaff = new Map(ratings.map((r) => [r.staffId, r]));

  // Recent reviews left specifically for this service.
  const reviews = await prisma.review.findMany({
    where: { serviceId: service.id, status: "APPROVED" },
    orderBy: { createdAt: "desc" },
    take: 15,
    include: {
      customer: { select: { firstName: true, lastName: true } },
      staff: { select: { user: { select: { name: true } } } },
    },
  });

  const canManage = ctx.permissions.includes(PERMISSIONS.SERVICE_MANAGE);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/services"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to services
      </Link>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-xl">{service.name}</CardTitle>
            <p className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              {service.category && <span>{service.category.name}</span>}
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {service.durationMinutes} min
              </span>
              <span className="font-semibold text-foreground">{formatCurrency(Number(service.price))}</span>
            </p>
          </div>
          {canManage && (
            <Button asChild variant="outline" size="sm">
              <Link href={`/services/${service.id}/edit`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>
          )}
        </CardHeader>
        {service.description && (
          <CardContent>
            <p className="text-sm text-muted-foreground">{service.description}</p>
          </CardContent>
        )}
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="size-4" />
              Team members offering this
            </CardTitle>
          </CardHeader>
          <CardContent>
            {service.staff.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No team members are assigned to this service yet.
              </p>
            ) : (
              <ul className="space-y-3">
                {service.staff.map(({ staff }) => {
                  const r = ratingByStaff.get(staff.id);
                  const avg = r?._avg.rating ?? 0;
                  return (
                    <li key={staff.id}>
                      <Link
                        href={`/staff/${staff.id}`}
                        className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                      >
                        <span
                          className="flex size-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                          style={{ backgroundColor: staff.color ?? "hsl(var(--primary))" }}
                        >
                          {initials(staff.user.name)}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{staff.user.name}</p>
                          {staff.jobTitle && (
                            <p className="text-xs text-muted-foreground">{staff.jobTitle}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <StarRating value={avg} size={13} />
                          <p className="text-xs text-muted-foreground">
                            {avg > 0 ? `${avg.toFixed(1)} (${r?._count ?? 0})` : "No ratings"}
                          </p>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent reviews</CardTitle>
          </CardHeader>
          <CardContent>
            {reviews.length === 0 ? (
              <p className="text-sm text-muted-foreground">No reviews for this service yet.</p>
            ) : (
              <ul className="space-y-4">
                {reviews.map((r) => (
                  <li key={r.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {r.customer.firstName} {r.customer.lastName?.charAt(0) ?? ""}.
                      </p>
                      <StarRating value={r.rating} size={14} />
                    </div>
                    <p className="text-xs text-muted-foreground">with {r.staff.user.name}</p>
                    {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
