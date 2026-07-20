import { NextRequest, NextResponse } from "next/server";
import { requirePermission, handle } from "@/lib/api-auth";
import { PERMISSIONS } from "@/lib/rbac";
import { resolveActiveBranch } from "@/lib/branch";
import { getReportsData } from "@/lib/queries/reports";
import { parseISO, isValid } from "date-fns";

/**
 * GET /api/reports/export?format=csv|xlsx&from=ISO&to=ISO
 * Streams a sales report in the requested format for the active branch.
 */
export const GET = handle(async (req: NextRequest) => {
  const ctx = await requirePermission(PERMISSIONS.REPORTS_VIEW);
  const { branchId } = await resolveActiveBranch(ctx);
  if (!branchId) {
    return NextResponse.json({ error: "No accessible branch" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const fmt = searchParams.get("format") === "xlsx" ? "xlsx" : "csv";
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const from = fromParam && isValid(parseISO(fromParam)) ? parseISO(fromParam) : new Date(Date.now() - 30 * 864e5);
  const to = toParam && isValid(parseISO(toParam)) ? parseISO(toParam) : new Date();

  const data = await getReportsData(branchId, { from, to });

  const headers = ["Invoice", "Date", "Customer", "Items", "Subtotal", "Discount", "Tax", "Total", "Status"];
  const rows = data.sales.map((s) => [
    s.invoiceNumber,
    s.date.toISOString().slice(0, 10),
    s.customer,
    s.items,
    s.subtotal.toFixed(2),
    s.discount.toFixed(2),
    s.tax.toFixed(2),
    s.total.toFixed(2),
    s.status,
  ]);

  const stamp = new Date().toISOString().slice(0, 10);

  if (fmt === "csv") {
    const escape = (v: string | number) => {
      const s = String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\r\n");
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="sales-report-${stamp}.csv"`,
      },
    });
  }

  // xlsx via exceljs
  const ExcelJS = (await import("exceljs")).default;
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Sales");
  ws.addRow(headers);
  ws.getRow(1).font = { bold: true };
  for (const r of rows) ws.addRow(r);
  ws.columns.forEach((col) => {
    col.width = 16;
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="sales-report-${stamp}.xlsx"`,
    },
  });
});
