import { HomeOverview } from "@/components/dashboard/home-overview";
import { AppShell } from "@/components/layout/app-shell";

export default function Home() {
  return (
    <AppShell>
      <HomeOverview />
    </AppShell>
  );
}
