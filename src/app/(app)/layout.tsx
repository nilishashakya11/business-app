import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AppShell } from "@/components/shell/app-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { role, branchIds, primaryBranchId } = session.user;

  // Admins can see every active branch; others only their assignments.
  const branches = await prisma.branch.findMany({
    where: role === "ADMIN" ? { isActive: true } : { id: { in: branchIds }, isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <AppShell
      user={{
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        role,
      }}
      permissions={session.user.permissions}
      branches={branches}
      defaultBranchId={primaryBranchId ?? branches[0]?.id ?? null}
    >
      {children}
    </AppShell>
  );
}
