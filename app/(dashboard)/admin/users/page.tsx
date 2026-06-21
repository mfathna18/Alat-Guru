import { redirect } from "next/navigation";

import { AdminUsersManager } from "@/components/admin/admin-users-manager";
import { isProfileAdmin } from "@/lib/auth/require-profile-admin";
import { getAllUsers } from "@/lib/services/admin-users";

export default async function AdminUsersPage() {
  const isAdmin = await isProfileAdmin();
  if (!isAdmin) redirect("/");

  let initialUsers;
  try {
    initialUsers = await getAllUsers();
  } catch {
    redirect("/");
  }

  return <AdminUsersManager initialUsers={initialUsers} />;
}
