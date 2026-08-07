import { cn } from "@/lib/utils";
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  /** Percentage change vs. previous period. */
  delta?: number;
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, delta, hint }: StatCardProps) {
  const hasDelta = typeof delta === "number" && Number.isFinite(delta);
  const positive = (delta ?? 0) >= 0;

  return (
    <Card className="relative overflow-hidden p-5">
      {/* Soft corner wash for a warmer, less template-like feel. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-6 -top-6 size-20 rounded-full bg-primary/5 blur-2xl"
      />
      <div className="relative flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="font-display text-2xl font-semibold tracking-tight">{value}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-secondary ring-1 ring-border">
          <Icon className="size-5 text-accent-foreground" strokeWidth={1.75} />
        </div>
      </div>
      {(hasDelta || hint) && (
        <div className="relative mt-3 flex items-center gap-2 text-xs">
          {hasDelta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium",
                positive
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {positive ? (
                <ArrowUpRight className="size-3" />
              ) : (
                <ArrowDownRight className="size-3" />
              )}
              {Math.abs(delta as number).toFixed(1)}%
            </span>
          )}
          {hint && <span className="text-muted-foreground">{hint}</span>}
        </div>
      )}
    </Card>
  );
}
