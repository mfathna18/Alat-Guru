import { redirect } from "next/navigation";

import { AdminFeatureStatsManager } from "@/components/admin/admin-feature-stats-manager";
import { isProfileAdmin } from "@/lib/auth/require-profile-admin";
import {
  fetchFeatureUsageStats,
  getEmptyFeatureUsageEntries,
} from "@/lib/services/feature-usage";

export default async function AdminFeatureStatsPage() {
  const isAdmin = await isProfileAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  let migrationPending = false;

  try {
    const initialEntries = await fetchFeatureUsageStats();
    return (
      <AdminFeatureStatsManager
        initialEntries={initialEntries}
        migrationPending={migrationPending}
      />
    );
  } catch {
    migrationPending = true;
    return (
      <AdminFeatureStatsManager
        initialEntries={getEmptyFeatureUsageEntries()}
        migrationPending={migrationPending}
      />
    );
  }
}
