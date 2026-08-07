interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        {/* Accent bar gives each page a distinct, branded edge. */}
        <span
          aria-hidden
          className="mt-1 h-9 w-1 shrink-0 rounded-full bg-gradient-to-b from-primary to-primary/40"
        />
        <div className="space-y-1">
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
