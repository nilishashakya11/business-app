import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PermissionKey } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export interface AuthedContext {
  userId: string;
  role: string;
  permissions: string[];
  branchIds: string[];
  primaryBranchId: string | null;
}

/** Require an authenticated session. Throws ApiError(401) if absent. */
export async function requireAuth(): Promise<AuthedContext> {
  const session = await auth();
  if (!session?.user) {
    throw new ApiError(401, "Unauthorized");
  }
  return {
    userId: session.user.id,
    role: session.user.role,
    permissions: session.user.permissions,
    branchIds: session.user.branchIds,
    primaryBranchId: session.user.primaryBranchId,
  };
}

/** Require a specific permission. Throws ApiError(403) if missing. */
export async function requirePermission(permission: PermissionKey): Promise<AuthedContext> {
  const ctx = await requireAuth();
  if (!ctx.permissions.includes(permission)) {
    throw new ApiError(403, "Forbidden: missing permission " + permission);
  }
  return ctx;
}

/**
 * Ensure the context can access a branch. Admins with view_all can access any;
 * otherwise the branch must be in the user's assigned branches.
 */
export function assertBranchAccess(ctx: AuthedContext, branchId: string) {
  if (ctx.role === "ADMIN") return;
  if (!ctx.branchIds.includes(branchId)) {
    throw new ApiError(403, "Forbidden: no access to this branch");
  }
}

/** Write an audit log entry. Best-effort; never throws. */
export async function audit(
  ctx: AuthedContext | null,
  action: string,
  entity: string,
  entityId?: string,
  metadata?: Record<string, unknown>,
) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: ctx?.userId ?? null,
        action,
        entity,
        entityId,
        metadata: metadata as never,
      },
    });
  } catch {
    // swallow — auditing must not break the request
  }
}

/** Wrap a route handler with consistent error handling. */
export function handle<T extends unknown[]>(
  fn: (...args: T) => Promise<NextResponse>,
): (...args: T) => Promise<NextResponse> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (err) {
      if (err instanceof ApiError) {
        return NextResponse.json({ error: err.message }, { status: err.status });
      }
      if (err && typeof err === "object" && "issues" in err) {
        // ZodError
        return NextResponse.json(
          { error: "Validation failed", issues: (err as { issues: unknown }).issues },
          { status: 422 },
        );
      }
      console.error("[API_ERROR]", err);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
