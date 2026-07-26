"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/utils";

const TOOLTIP_STYLE = {
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--popover))",
  fontSize: 12,
};

/** Warm earth-tone categorical palette (camel, clay, olive, terracotta, sand). */
const PALETTE = [
  "hsl(var(--primary))",
  "#a8754e", // clay
  "#7d8b5a", // olive
  "#c08552", // camel
  "#9c5a3c", // terracotta
  "#b89b72", // sand
  "#6f5643", // espresso
  "#8a9a5b", // moss
  "#cb974f", // ochre
];

export function RevenueByMonthChart({ data }: { data: { label: string; revenue: number }[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={56}
            tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number) => [formatCurrency(value), "Revenue"]}
          />
          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={48} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PaymentMixChart({ data }: { data: { method: string; amount: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
        No payments in this period.
      </div>
    );
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="method"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
            stroke="hsl(var(--card))"
            strokeWidth={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(value: number, name: string) => [formatCurrency(value), name]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export { PALETTE };
