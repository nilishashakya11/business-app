import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { AuthedContext } from "@/lib/api-auth";

export const BRANCH_COOKIE = "gng.activeBranch";

/**
 * Resolve the branch a request should operate on, honoring the active-branch
 * cookie but always constrained to branches the user may access.
 *
 * Returns the resolved branchId plus the full set of branchIds the user can see
 * (useful for "all branches" report queries).
 */
export async function resolveActiveBranch(
  ctx: AuthedContext,
): Promise<{ branchId: string | null; accessibleBranchIds: string[] }> {
  const accessibleBranchIds =
    ctx.role === "ADMIN"
      ? (await prisma.branch.findMany({ where: { isActive: true }, select: { id: true } })).map(
          (b) => b.id,
        )
      : ctx.branchIds;

  const cookieBranch = (await cookies()).get(BRANCH_COOKIE)?.value ?? null;

  const branchId =
    cookieBranch && accessibleBranchIds.includes(cookieBranch)
      ? cookieBranch
      : ctx.primaryBranchId && accessibleBranchIds.includes(ctx.primaryBranchId)
        ? ctx.primaryBranchId
        : (accessibleBranchIds[0] ?? null);

  return { branchId, accessibleBranchIds };
}
