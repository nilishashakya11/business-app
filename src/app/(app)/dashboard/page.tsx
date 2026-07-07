import Link from "next/link";
import {
  Banknote,
  CalendarClock,
  UserPlus,
  Receipt,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import { requireAuth } from "@/lib/api-auth";
import { resolveActiveBranch } from "@/lib/branch";
import { getDashboardData } from "@/lib/queries/dashboard";
import { PageHeader } from "@/components/shell/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { StatusBadge } from "@/components/appointments/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatCurrency, formatTime } from "@/lib/utils";

export const metadata = { title: "Dashboard — Glow & Go" };

export default async function DashboardPage() {
  const ctx = await requireAuth();
  const { branchId } = await resolveActiveBranch(ctx);

  if (!branchId) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Your business at a glance." />
        <EmptyState
          icon={AlertTriangle}
          title="No branch assigned"
          description="You don't have access to any branch yet. Ask an administrator to add you to one."
        />
      </div>
    );
  }

  const data = await getDashboardData(branchId);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Your business at a glance." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={formatCurrency(data.revenueToday)}
          icon={Banknote}
          delta={data.revenueDelta ?? undefined}
          hint="vs. yesterday"
        />
        <StatCard
          label="Appointments today"
          value={String(data.appointmentsToday)}
          icon={CalendarClock}
        />
        <StatCard
          label="Avg. ticket (30d)"
          value={formatCurrency(data.avgTicket)}
          icon={Receipt}
        />
        <StatCard
          label="New customers (7d)"
          value={String(data.newCustomers)}
          icon={UserPlus}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <RevenueChart data={data.revenueSeries} />

        <Card>
          <CardHeader>
            <CardTitle>Top services</CardTitle>
            <p className="text-sm text-muted-foreground">By revenue, last 30 days</p>
          </CardHeader>
          <CardContent>
            {data.topServices.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No sales yet.</p>
            ) : (
              <ul className="space-y-4">
                {data.topServices.map((s, i) => {
                  const max = data.topServices[0].revenue || 1;
                  return (
                    <li key={s.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {i + 1}
                          </span>
                          {s.name}
                        </span>
                        <span className="font-medium">{formatCurrency(s.revenue)}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(6, (s.revenue / max) * 100)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Upcoming today</CardTitle>
            <p className="text-sm text-muted-foreground">Next appointments on the schedule</p>
          </div>
          <Link
            href="/calendar"
            className="text-sm font-medium text-primary hover:underline"
          >
            View calendar
          </Link>
        </CardHeader>
        <CardContent>
          {data.upcoming.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title="Nothing left today"
              description="No more upcoming appointments for the rest of the day."
              className="py-10"
            />
          ) : (
            <ul className="divide-y">
              {data.upcoming.map((a) => (
                <li key={a.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="w-16 shrink-0 text-sm font-medium tabular-nums">
                    {formatTime(a.startTime)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.customer}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.service} &middot; {a.staff}
                    </p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {data.lowStock > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
            <p className="text-sm">
              <span className="font-medium">{data.lowStock}</span> product
              {data.lowStock === 1 ? " is" : "s are"} at or below the low-stock level.{" "}
              <Link href="/inventory" className="font-medium text-primary hover:underline">
                Review inventory
              </Link>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
