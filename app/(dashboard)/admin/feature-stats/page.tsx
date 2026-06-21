export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { AdminFeatureStatsManager } from "@/components/admin/admin-feature-stats-manager";
import { isProfileAdmin } from "@/lib/auth/require-profile-admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  fetchFeatureUsageStats,
  getEmptyFeatureUsageEntries,
} from "@/lib/services/feature-usage";

export default async function AdminFeatureStatsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AdminFeatureStatsManager
        initialEntries={getEmptyFeatureUsageEntries()}
        migrationPending
      />
    );
  }

  const isAdmin = await isProfileAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  try {
    const initialEntries = await fetchFeatureUsageStats();
    return (
      <AdminFeatureStatsManager
        initialEntries={initialEntries}
        migrationPending={false}
      />
    );
  } catch {
    return (
      <AdminFeatureStatsManager
        initialEntries={getEmptyFeatureUsageEntries()}
        migrationPending
      />
    );
  }
}
