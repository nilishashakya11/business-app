import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-accent">
        <Icon className="size-6 text-accent-foreground" strokeWidth={1.5} />
      </div>
      <div className="space-y-1">
        <h3 className="font-display text-base font-semibold">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
