"use client";

import * as React from "react";
import { Plus, UsersRound, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { initials } from "@/lib/utils";
import { StaffDialog, type StaffRecord } from "./staff-dialog";

export interface StaffListItem extends StaffRecord {
  isActive: boolean;
  appointmentCount: number;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  TEAM_MEMBER: "Team member",
};

export function StaffClient({
  staff,
  branchId,
  canManage,
}: {
  staff: StaffListItem[];
  branchId: string | null;
  canManage: boolean;
}) {
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<StaffRecord | null>(null);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(s: StaffListItem) {
    setEditing(s);
    setDialogOpen(true);
  }

  if (!branchId) {
    return (
      <EmptyState
        icon={UsersRound}
        title="No branch selected"
        description="Select a branch from the top bar to manage its team."
      />
    );
  }

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={openNew}>
            <Plus className="size-4" />
            New team member
          </Button>
        </div>
      )}

      {staff.length === 0 ? (
        <EmptyState
          icon={UsersRound}
          title="No team members yet"
          description="Add the people who work at this branch."
          action={
            canManage ? (
              <Button onClick={openNew}>
                <Plus className="size-4" />
                New team member
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {staff.map((s) => (
            <Card key={s.id} className={s.isActive ? "" : "opacity-60"}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex size-11 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: s.color ?? "#8b5cf6" }}
                  >
                    {initials(s.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.jobTitle ?? ROLE_LABELS[s.role]}
                    </p>
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
                <div className="mt-4 flex items-center justify-between text-sm">
                  <Badge variant="secondary">{ROLE_LABELS[s.role] ?? s.role}</Badge>
                  <span className="text-muted-foreground">
                    {Number(s.commissionRate)}% commission
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {s.appointmentCount} appointment{s.appointmentCount === 1 ? "" : "s"} booked
                  {!s.isActive && " · inactive"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <StaffDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        staff={editing}
        branchId={branchId}
      />
    </div>
  );
}
