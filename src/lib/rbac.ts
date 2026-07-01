import { Role } from "@prisma/client";

/**
 * Permission keys used throughout the app. Grouped by domain.
 * Fine-grained keys allow per-user overrides on top of role defaults.
 */
export const PERMISSIONS = {
  // Appointments
  APPOINTMENT_VIEW: "appointment.view",
  APPOINTMENT_VIEW_OWN: "appointment.view_own",
  APPOINTMENT_CREATE: "appointment.create",
  APPOINTMENT_UPDATE: "appointment.update",
  APPOINTMENT_UPDATE_STATUS: "appointment.update_status",
  APPOINTMENT_DELETE: "appointment.delete",

  // Customers
  CUSTOMER_VIEW: "customer.view",
  CUSTOMER_MANAGE: "customer.manage",

  // Staff
  STAFF_VIEW: "staff.view",
  STAFF_MANAGE: "staff.manage",
  STAFF_VIEW_OWN_METRICS: "staff.view_own_metrics",

  // Services
  SERVICE_VIEW: "service.view",
  SERVICE_MANAGE: "service.manage",

  // Billing
  BILLING_VIEW: "billing.view",
  BILLING_MANAGE: "billing.manage",
  BILLING_REFUND: "billing.refund",

  // Inventory
  INVENTORY_VIEW: "inventory.view",
  INVENTORY_MANAGE: "inventory.manage",

  // Reports
  REPORTS_VIEW: "reports.view",
  REPORTS_VIEW_ALL_BRANCHES: "reports.view_all_branches",

  // Settings & admin
  SETTINGS_MANAGE: "settings.manage",
  USERS_MANAGE: "users.manage",
  BRANCHES_MANAGE: "branches.manage",
  PAYMENTS_CONFIGURE: "payments.configure",
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Default permissions granted to each role. */
const ROLE_PERMISSIONS: Record<Role, PermissionKey[]> = {
  ADMIN: Object.values(PERMISSIONS),
  MANAGER: [
    PERMISSIONS.APPOINTMENT_VIEW,
    PERMISSIONS.APPOINTMENT_CREATE,
    PERMISSIONS.APPOINTMENT_UPDATE,
    PERMISSIONS.APPOINTMENT_UPDATE_STATUS,
    PERMISSIONS.APPOINTMENT_DELETE,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.CUSTOMER_MANAGE,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.SERVICE_VIEW,
    PERMISSIONS.SERVICE_MANAGE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_MANAGE,
    PERMISSIONS.BILLING_REFUND,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_MANAGE,
    PERMISSIONS.REPORTS_VIEW,
  ],
  TEAM_MEMBER: [
    PERMISSIONS.APPOINTMENT_VIEW_OWN,
    PERMISSIONS.APPOINTMENT_UPDATE_STATUS,
    PERMISSIONS.CUSTOMER_VIEW,
    PERMISSIONS.SERVICE_VIEW,
    PERMISSIONS.STAFF_VIEW_OWN_METRICS,
  ],
};

/** Check if a role has a given permission by default. */
export function roleHasPermission(role: Role, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRolePermissions(role: Role): PermissionKey[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Resolve effective permissions: role defaults + explicit grants − explicit denies.
 * `overrides` is a map of permissionKey -> granted(boolean).
 */
export function resolvePermissions(
  role: Role,
  overrides: Record<string, boolean> = {},
): Set<string> {
  const effective = new Set<string>(getRolePermissions(role));
  for (const [key, granted] of Object.entries(overrides)) {
    if (granted) effective.add(key);
    else effective.delete(key);
  }
  return effective;
}

export function can(
  role: Role,
  permission: PermissionKey,
  overrides: Record<string, boolean> = {},
): boolean {
  return resolvePermissions(role, overrides).has(permission);
}
