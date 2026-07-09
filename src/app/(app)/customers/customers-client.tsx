"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, Users, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { CustomerDialog, type CustomerRecord } from "./customer-dialog";
import { initials } from "@/lib/utils";

export interface CustomerListItem extends CustomerRecord {
  loyaltyPoints: number;
  _count: { appointments: number; invoices: number };
}

export function CustomersClient({
  initialCustomers,
  canManage,
}: {
  initialCustomers: CustomerListItem[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<CustomerRecord | null>(null);

  // Client-side filter over the loaded set; server search backs the initial load.
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialCustomers;
    return initialCustomers.filter((c) =>
      [c.firstName, c.lastName, c.email, c.phone]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q)),
    );
  }, [query, initialCustomers]);

  function openNew() {
    setEditing(null);
    setDialogOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, email"
            className="pl-9"
          />
        </div>
        {canManage && (
          <Button onClick={openNew}>
            <Plus className="size-4" />
            New customer
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={query ? "No matches" : "No customers yet"}
          description={
            query
              ? "Try a different name, phone, or email."
              : "Add your first customer to start booking appointments."
          }
          action={
            canManage && !query ? (
              <Button onClick={openNew}>
                <Plus className="size-4" />
                New customer
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-right">Visits</TableHead>
                <TableHead className="text-right">Loyalty</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/customers/${c.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                        {initials(`${c.firstName} ${c.lastName ?? ""}`)}
                      </div>
                      <div>
                        <p className="font-medium">
                          {c.firstName} {c.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {c._count.appointments} appointment
                          {c._count.appointments === 1 ? "" : "s"}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-0.5 text-sm">
                      {c.phone && (
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="size-3" />
                          {c.phone}
                        </p>
                      )}
                      {c.email && (
                        <p className="flex items-center gap-1.5 text-muted-foreground">
                          <Mail className="size-3" />
                          {c.email}
                        </p>
                      )}
                      {!c.phone && !c.email && (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {c._count.invoices}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary">{c.loyaltyPoints} pts</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <CustomerDialog open={dialogOpen} onOpenChange={setDialogOpen} customer={editing} />
    </div>
  );
}
