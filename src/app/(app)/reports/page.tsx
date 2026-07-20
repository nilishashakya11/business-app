import { redirect } from "next/navigation";
import { format, subMonths, startOfMonth } from "date-fns";
import { requireAuth } from "@/lib/api-auth";
import { PERMISSIONS } from "@/lib/rbac";
import { resolveActiveBranch } from "@/lib/branch";
import { prisma } from "@/lib/prisma";
import { getReportsData } from "@/lib/queries/reports";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ReportsClient } from "./reports-client";
import { BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ from?: string; to?: string }>;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(PERMISSIONS.REPORTS_VIEW)) {
    redirect("/dashboard");
  }

  const { branchId } = await resolveActiveBranch(ctx);
  const params = await searchParams;

  if (!branchId) {
    return (
      <div>
        <PageHeader title="Reports" description="Sales, revenue and performance analytics." />
        <EmptyState
          icon={BarChart3}
          title="No branch available"
          description="You do not have access to any branch yet."
        />
      </div>
    );
  }

  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    select: { name: true },
  });

  const today = new Date();
  const defaultFrom = startOfMonth(subMonths(today, 5));
  const from = params.from ?? format(defaultFrom, "yyyy-MM-dd");
  const to = params.to ?? format(today, "yyyy-MM-dd");

  const data = await getReportsData(branchId, {
    from: new Date(from),
    to: new Date(to),
  });

  return (
    <div>
      <PageHeader
        title="Reports"
        description={`Analytics for ${branch?.name ?? "branch"}. Filter by date and export to CSV or Excel.`}
      />
      <ReportsClient data={data} from={from} to={to} branchId={branchId} />
    </div>
  );
}
