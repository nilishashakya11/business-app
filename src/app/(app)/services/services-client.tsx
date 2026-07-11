"use client";

import * as React from "react";
import { Plus, Sparkles, Clock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency } from "@/lib/utils";
import {
  ServiceDialog,
  type ServiceRecord,
  type CategoryOption,
} from "./service-dialog";

export interface ServiceListItem extends ServiceRecord {
  category: { id: string; name: string } | null;
}

export function ServicesClient({
  services,
  categories,
  branchId,
  canManage,
}: {
  services: ServiceListItem[];
  categories: CategoryOption[];
  branchId: string | null;
  canManage: boolean;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<ServiceRecord | null>(null);

  // Group services by category name for display.
  const grouped = React.useMemo(() => {
    const map = new Map<string, ServiceListItem[]>();
    for (const s of services) {
      const key = s.category?.name ?? "Uncategorized";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries());
  }, [services]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(s: ServiceListItem) {
    setEditing(s);
    setDialogOpen(true);
  }

  if (!branchId) {
    return (
      <EmptyState
        icon={Sparkles}
        title="No branch selected"
        description="Select a branch from the top bar to manage its services."
      />
    );
  }

  return (
    <div className="space-y-6">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={openNew}>
            <Plus className="size-4" />
            New service
          </Button>
        </div>
      )}

      {services.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No services yet"
          description="Add the treatments and services this branch offers."
          action={
            canManage ? (
              <Button onClick={openNew}>
                <Plus className="size-4" />
                New service
              </Button>
            ) : undefined
          }
        />
      ) : (
        grouped.map(([category, items]) => (
          <section key={category} className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {category}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((s) => (
                <Card key={s.id} className={s.isActive ? "" : "opacity-60"}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.name}</p>
                        {s.description && (
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {s.description}
                          </p>
                        )}
                      </div>
                      {canManage && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3.5" />
                        {s.durationMinutes} min
                      </span>
                      <div className="flex items-center gap-2">
                        {!s.isActive && <Badge variant="secondary">Inactive</Badge>}
                        <span className="font-semibold">{formatCurrency(Number(s.price))}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}

      <ServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        service={editing}
        branchId={branchId}
        categories={categories}
      />
    </div>
  );
}
