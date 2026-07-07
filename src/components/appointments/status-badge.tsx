import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  BOOKED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  CONFIRMED: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  ARRIVED: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  IN_PROGRESS: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
  NO_SHOW: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  WAITLIST: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
};

const STATUS_LABELS: Record<string, string> = {
  BOOKED: "Booked",
  CONFIRMED: "Confirmed",
  ARRIVED: "Arrived",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  NO_SHOW: "No show",
  WAITLIST: "Waitlist",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn("font-medium", STATUS_STYLES[status] ?? "", className)}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  );
}
