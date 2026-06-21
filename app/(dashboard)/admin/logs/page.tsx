import { redirect } from "next/navigation";

import { AdminLogsManager } from "@/components/admin/admin-logs-manager";
import { isProfileAdmin } from "@/lib/auth/require-profile-admin";
import { getAdminLogs } from "@/lib/services/admin-logs";

export default async function AdminLogsPage() {
  const isAdmin = await isProfileAdmin();
  if (!isAdmin) {
    redirect("/dashboard");
  }

  let initialLogs;
  try {
    initialLogs = await getAdminLogs();
  } catch {
    redirect("/dashboard");
  }

  return <AdminLogsManager initialLogs={initialLogs} />;
}
