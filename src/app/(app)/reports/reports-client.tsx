"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { BarChart3 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { RevenueByMonthChart, PaymentMixChart, PALETTE } from "@/components/reports/report-charts";
import type { ReportsData } from "@/lib/queries/reports";

interface Props {
  data: ReportsData;
  from: string;
  to: string;
  branchId: string;
}

export function ReportsClient({ data, from, to, branchId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fromDate, setFromDate] = React.useState(from);
  const [toDate, setToDate] = React.useState(to);

  function applyRange() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("from", fromDate);
    params.set("to", toDate);
    router.push(`/reports?${params.toString()}`);
  }

  function exportReport(fmt: "csv" | "xlsx") {
    const params = new URLSearchParams({ from: fromDate, to: toDate, format: fmt, branchId });
    window.open(`/api/reports/export?${params.toString()}`, "_blank");
  }

  const { summary } = data;

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <Card>
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="from">From</Label>
              <Input
                id="from"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="to">To</Label>
              <Input
                id="to"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button onClick={applyRange}>Apply</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => exportReport("csv")}>
              <FileText className="size-4" />
              CSV
            </Button>
            <Button variant="outline" onClick={() => exportReport("xlsx")}>
              <FileSpreadsheet className="size-4" />
              Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile label="Gross revenue" value={formatCurrency(summary.grossRevenue)} />
        <KpiTile label="Invoices" value={String(summary.invoiceCount)} />
        <KpiTile label="Average ticket" value={formatCurrency(summary.avgTicket)} />
        <KpiTile label="Tax collected" value={formatCurrency(summary.taxTotal)} />
        <KpiTile label="Discounts given" value={formatCurrency(summary.discountTotal)} />
        <KpiTile label="New customers" value={String(summary.newCustomers)} />
        <KpiTile
          label="Cancellation rate"
          value={`${summary.cancellationRate.toFixed(1)}%`}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue by month</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueByMonthChart data={data.revenueByMonth} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Payment mix</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentMixChart data={data.paymentMix} />
            <ul className="mt-4 space-y-1.5">
              {data.paymentMix.map((p, i) => (
                <li key={p.method} className="flex items-center gap-2 text-sm">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: PALETTE[i % PALETTE.length] }}
                  />
                  <span className="flex-1 text-muted-foreground">{p.method}</span>
                  <span className="tabular-nums">{formatCurrency(p.amount)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Staff performance + top services */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Staff performance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.staffPerformance.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No data for this period.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team member</TableHead>
                    <TableHead className="text-right">Appts</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.staffPerformance.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.appointments}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(s.revenue)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(s.commission)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top services</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {data.topServices.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">No data for this period.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Sold</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.topServices.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell className="text-right tabular-nums">{s.count}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatCurrency(s.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sales ledger */}
      <Card>
        <CardHeader>
          <CardTitle>Sales ledger</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {data.sales.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No sales in range"
              description="Adjust the date range to see invoices."
              className="m-6"
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="text-right">Tax</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.sales.slice(0, 100).map((s) => (
                  <TableRow key={s.invoiceNumber}>
                    <TableCell className="font-medium">{s.invoiceNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(s.date)}</TableCell>
                    <TableCell>{s.customer}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(s.tax)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(s.total)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {data.sales.length > 100 && (
            <p className="border-t p-3 text-center text-xs text-muted-foreground">
              Showing first 100 of {data.sales.length} invoices. Export for the full ledger.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-xl font-semibold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
