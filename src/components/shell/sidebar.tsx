"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCog,
  Scissors,
  Receipt,
  Package,
  BarChart3,
  Settings,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PERMISSIONS, type PermissionKey } from "@/lib/rbac";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Any one of these permissions grants visibility. Empty = always visible. */
  permissions: PermissionKey[];
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permissions: [] },
  {
    href: "/calendar",
    label: "Calendar",
    icon: CalendarDays,
    permissions: [PERMISSIONS.APPOINTMENT_VIEW, PERMISSIONS.APPOINTMENT_VIEW_OWN],
  },
  { href: "/customers", label: "Customers", icon: Users, permissions: [PERMISSIONS.CUSTOMER_VIEW] },
  { href: "/staff", label: "Team", icon: UserCog, permissions: [PERMISSIONS.STAFF_VIEW] },
  { href: "/services", label: "Services", icon: Scissors, permissions: [PERMISSIONS.SERVICE_VIEW] },
  { href: "/billing", label: "Billing", icon: Receipt, permissions: [PERMISSIONS.BILLING_VIEW] },
  {
    href: "/inventory",
    label: "Inventory",
    icon: Package,
    permissions: [PERMISSIONS.INVENTORY_VIEW],
  },
  { href: "/reports", label: "Reports", icon: BarChart3, permissions: [PERMISSIONS.REPORTS_VIEW] },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    permissions: [PERMISSIONS.SETTINGS_MANAGE],
  },
];

interface SidebarProps {
  permissions: string[];
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ permissions, open, onClose }: SidebarProps) {
  const pathname = usePathname();

  const items = NAV.filter(
    (item) => item.permissions.length === 0 || item.permissions.some((p) => permissions.includes(p)),
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="font-display text-base font-bold">G</span>
            </div>
            <span className="font-display text-base font-semibold tracking-tight">Glow &amp; Go</span>
          </Link>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted lg:hidden"
            aria-label="Close menu"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3 scroll-thin">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "size-[18px] transition-colors",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                  )}
                  strokeWidth={1.75}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <p className="px-3 text-[11px] text-muted-foreground">v1.0 &middot; Kathmandu</p>
        </div>
      </aside>
    </>
  );
}
