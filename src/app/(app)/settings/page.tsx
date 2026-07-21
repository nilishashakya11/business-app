import { redirect } from "next/navigation";
import { Settings as SettingsIcon } from "lucide-react";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/rbac";
import { PageHeader } from "@/components/shell/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileForm } from "./profile-form";
import { BusinessForm } from "./business-form";
import { BranchesManager, type BranchRecord } from "./branches-manager";

export const metadata = { title: "Settings — Glow & Go" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const ctx = await requireAuth();

  const user = await prisma.user.findUnique({
    where: { id: ctx.userId },
    select: { name: true, email: true, phone: true },
  });
  if (!user) redirect("/login");

  const isAdmin = ctx.permissions.includes(PERMISSIONS.SETTINGS_MANAGE);
  const canManageBranches = ctx.permissions.includes(PERMISSIONS.BRANCHES_MANAGE);

  const business = isAdmin
    ? await prisma.business.findFirst({ orderBy: { createdAt: "asc" } })
    : null;

  const branchRecords = canManageBranches
    ? await prisma.branch.findMany({
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { staff: true } } },
      })
    : [];

  const branches: BranchRecord[] = branchRecords.map((b) => ({
    id: b.id,
    name: b.name,
    address: b.address,
    city: b.city,
    phone: b.phone,
    email: b.email,
    isActive: b.isActive,
    staffCount: b._count.staff,
  }));

  return (
    <div>
      <PageHeader title="Settings" description="Manage your profile, business and branches." />

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          {isAdmin && <TabsTrigger value="business">Business</TabsTrigger>}
          {canManageBranches && <TabsTrigger value="branches">Branches</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Your profile</CardTitle>
              <CardDescription>Update your name, phone and password.</CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileForm
                user={{ name: user.name, email: user.email, phone: user.phone }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && business && (
          <TabsContent value="business">
            <Card>
              <CardHeader>
                <CardTitle>Business details</CardTitle>
                <CardDescription>
                  These settings apply across all branches.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BusinessForm
                  business={{
                    id: business.id,
                    name: business.name,
                    currency: business.currency,
                    timezone: business.timezone,
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {canManageBranches && (
          <TabsContent value="branches">
            <BranchesManager branches={branches} />
          </TabsContent>
        )}
      </Tabs>

      {!isAdmin && !canManageBranches && (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <SettingsIcon className="size-4" />
          Additional settings are available to administrators.
        </p>
      )}
    </div>
  );
}
