import { PageHeader } from "@/components/shell/page-header";

export const metadata = { title: "Dashboard — Glow & Go" };

export default function DashboardPage() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Your business at a glance." />
    </div>
  );
}
