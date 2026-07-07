"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export interface BranchOption {
  id: string;
  name: string;
}

interface BranchContextValue {
  branches: BranchOption[];
  activeBranchId: string | null;
  setActiveBranchId: (id: string) => void;
  activeBranch: BranchOption | null;
}

const BranchContext = React.createContext<BranchContextValue | null>(null);

export const BRANCH_COOKIE = "gng.activeBranch";

function writeCookie(id: string) {
  // One-year cookie so server components can read the active branch.
  document.cookie = `${BRANCH_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
}

export function BranchProvider({
  branches,
  defaultBranchId,
  children,
}: {
  branches: BranchOption[];
  defaultBranchId: string | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [activeBranchId, setActive] = React.useState<string | null>(
    defaultBranchId ?? branches[0]?.id ?? null,
  );

  const setActiveBranchId = React.useCallback(
    (id: string) => {
      setActive(id);
      writeCookie(id);
      // Re-render server components so data reflects the new branch.
      router.refresh();
    },
    [router],
  );

  const value = React.useMemo<BranchContextValue>(
    () => ({
      branches,
      activeBranchId,
      setActiveBranchId,
      activeBranch: branches.find((b) => b.id === activeBranchId) ?? null,
    }),
    [branches, activeBranchId, setActiveBranchId],
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranch() {
  const ctx = React.useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within BranchProvider");
  return ctx;
}
