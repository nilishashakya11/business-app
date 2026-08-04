"use client";

import * as React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { BranchProvider, type BranchOption } from "./branch-context";

interface AppShellProps {
  user: { name: string; email: string; role: string };
  business: { name: string; logoUrl: string | null };
  permissions: string[];
  branches: BranchOption[];
  defaultBranchId: string | null;
  children: React.ReactNode;
}

export function AppShell({
  user,
  business,
  permissions,
  branches,
  defaultBranchId,
  children,
}: AppShellProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <BranchProvider branches={branches} defaultBranchId={defaultBranchId}>
      <div className="flex min-h-[100dvh] bg-background">
        <Sidebar
          business={business}
          permissions={permissions}
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar user={user} business={business} onMenu={() => setMenuOpen(true)} />
          <main className="flex-1 px-4 py-6 lg:px-6 lg:py-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </BranchProvider>
  );
}
