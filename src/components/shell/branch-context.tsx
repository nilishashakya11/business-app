"use client";

import * as React from "react";

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

const STORAGE_KEY = "gng.activeBranch";

export function BranchProvider({
  branches,
  defaultBranchId,
  children,
}: {
  branches: BranchOption[];
  defaultBranchId: string | null;
  children: React.ReactNode;
}) {
  const [activeBranchId, setActive] = React.useState<string | null>(
    defaultBranchId ?? branches[0]?.id ?? null,
  );

  // Restore last selection from localStorage if it is still a valid branch.
  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && branches.some((b) => b.id === stored)) {
      setActive(stored);
    }
  }, [branches]);

  const setActiveBranchId = React.useCallback((id: string) => {
    setActive(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

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
