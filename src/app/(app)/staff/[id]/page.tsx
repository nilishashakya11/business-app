import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Pencil, Scissors } from "lucide-react";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StarRating } from "@/components/reviews/star-rating";
import { formatDate, initials } from "@/lib/utils";

export const metadata = { title: "Team member — Glow & Go" };

export default async function StaffProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.STAFF_VIEW)) redirect("/dashboard");
  const { branchId } = await resolveActiveBranch(ctx);
  const { id } = await params;

  const staff = await prisma.staff.findFirst({
    where: { id, ...(branchId ? { branchId } : {}) },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      services: { include: { service: { select: { id: true, name: true } } } },
    },
  });
  if (!staff) notFound();

  const [agg, reviews] = await Promise.all([
    prisma.review.aggregate({
      where: { staffId: staff.id, status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.findMany({
      where: { staffId: staff.id, status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        customer: { select: { firstName: true, lastName: true } },
        service: { select: { name: true } },
      },
    }),
  ]);

  const avg = agg._avg.rating ?? 0;
  const canManage = ctx.permissions.includes(PERMISSIONS.STAFF_MANAGE);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/staff"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to team
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between">
              <div className="flex items-center gap-4">
                <span
                  className="flex size-16 items-center justify-center rounded-full text-xl font-semibold text-white"
                  style={{ backgroundColor: staff.color ?? "hsl(var(--primary))" }}
                >
                  {initials(staff.user.name)}
                </span>
                <div>
                  <CardTitle className="text-xl">{staff.user.name}</CardTitle>
                  {staff.jobTitle && (
                    <p className="text-sm text-muted-foreground">{staff.jobTitle}</p>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    <StarRating value={avg} />
                    <span className="text-sm text-muted-foreground">
                      {avg > 0 ? avg.toFixed(1) : "No ratings"}
                      {agg._count > 0 && ` (${agg._count})`}
                    </span>
                  </div>
                </div>
              </div>
              {canManage && (
                <Button asChild variant="outline" size="sm">
                  <Link href={`/staff/${staff.id}/edit`}>
                    <Pencil className="size-4" />
                    Edit
                  </Link>
                </Button>
              )}
            </CardHeader>
            {staff.bio && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{staff.bio}</p>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Reviews {agg._count > 0 && <span className="text-muted-foreground">({agg._count})</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-sm text-muted-foreground">No reviews yet.</p>
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
                      {r.service && (
                        <p className="text-xs text-muted-foreground">{r.service.name}</p>
                      )}
                      {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
                      <p className="mt-1 text-xs text-muted-foreground">{formatDate(r.createdAt)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Services offered</CardTitle>
            </CardHeader>
            <CardContent>
              {staff.services.length === 0 ? (
                <p className="text-sm text-muted-foreground">No services assigned.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {staff.services.map((s) => (
                    <Link key={s.service.id} href={`/services/${s.service.id}`}>
                      <Badge variant="outline" className="gap-1 hover:border-primary">
                        <Scissors className="size-3" />
                        {s.service.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>{staff.user.email}</p>
              {staff.user.phone && <p className="text-muted-foreground">{staff.user.phone}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
