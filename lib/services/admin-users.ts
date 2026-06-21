import {
  ADMIN_UNAUTHORIZED_ERROR,
  requireProfileAdmin,
} from "@/lib/auth/require-profile-admin";
import { logAdminAction } from "@/lib/services/admin-logs";
import { syncGuruSubscriptionFromProfile } from "@/lib/services/profile-subscription-sync";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { ADMIN_ACTION_TYPES } from "@/lib/types/admin-log";
import {
  buildEmptyProfileAggregates,
  type ProfileAggregates,
} from "@/lib/types/admin-stats";
import {
  isPaidSubscriptionPlan,
  isProfileRole,
  isSubscriptionPlan,
  type PaidSubscriptionPlan,
  type ProfileRole,
  type SubscriptionPlan,
  type UserProfile,
} from "@/lib/types/profile";
import { calculateExpirationDate } from "@/utils/subscription";

const PROFILE_COLUMNS =
  "id, updated_at, full_name, email, role, subscription_plan, subscription_expires_at" as const;

/**
 * Ambil semua baris dari public.profiles.
 * Hanya dapat diakses oleh user dengan role `admin` (dicek di server + RLS).
 */
export async function getAllUsers(): Promise<UserProfile[]> {
  const { supabase } = await requireProfileAdmin();

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return (data ?? []) as UserProfile[];
}

export interface UpdateUserProfileInput {
  userId: string;
  role: ProfileRole;
  subscriptionPlan: SubscriptionPlan;
}

/**
 * Perbarui role & paket langganan satu user.
 * `subscription_expires_at` dihitung via calculateExpirationDate.
 */
export async function updateUserProfile({
  userId,
  role,
  subscriptionPlan,
}: UpdateUserProfileInput): Promise<UserProfile> {
  const { supabase, user } = await requireProfileAdmin();

  const trimmedUserId = userId?.trim();
  if (!trimmedUserId) {
    throw new Error("userId wajib diisi.");
  }

  if (!isProfileRole(role)) {
    throw new Error("Role tidak valid. Gunakan: admin atau user.");
  }

  if (!isSubscriptionPlan(subscriptionPlan)) {
    throw new Error(
      "Paket langganan tidak valid. Gunakan: free, 1_month, 3_months, atau 1_year.",
    );
  }

  const subscriptionExpiresAt = calculateExpirationDate(subscriptionPlan);

  const { data: previous, error: previousError } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", trimmedUserId)
    .maybeSingle();

  if (previousError) {
    throw new Error(formatSupabaseError(previousError));
  }

  if (!previous) {
    throw new Error("Profil pengguna tidak ditemukan.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      role,
      subscription_plan: subscriptionPlan,
      subscription_expires_at: subscriptionExpiresAt,
    })
    .eq("id", trimmedUserId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("Profil pengguna tidak ditemukan.");
    }
    throw new Error(formatSupabaseError(error));
  }

  if (!data) {
    throw new Error("Profil pengguna tidak ditemukan.");
  }

  const previousProfile = previous as UserProfile;
  const updatedProfile = data as UserProfile;

  await syncGuruSubscriptionFromProfile(
    trimmedUserId,
    updatedProfile.subscription_plan,
    updatedProfile.subscription_expires_at,
  );

  void logAdminAction({
    adminId: user.id,
    actionType: ADMIN_ACTION_TYPES.UPDATE_USER_STATUS,
    details: {
      description: "Memperbarui role dan paket langganan pengguna",
      target_user_id: trimmedUserId,
      target_email: updatedProfile.email,
      old_role: previousProfile.role,
      new_role: updatedProfile.role,
      old_subscription_plan: previousProfile.subscription_plan,
      new_subscription_plan: updatedProfile.subscription_plan,
      new_subscription_expires_at: updatedProfile.subscription_expires_at,
    },
  });

  return updatedProfile;
}

/**
 * Batalkan langganan user: set subscription_plan = free, subscription_expires_at = null.
 */
export async function cancelSubscription(userId: string): Promise<UserProfile> {
  const { supabase, user } = await requireProfileAdmin();

  const trimmedUserId = userId?.trim();
  if (!trimmedUserId) {
    throw new Error("userId wajib diisi.");
  }

  const { data: previous, error: previousError } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", trimmedUserId)
    .maybeSingle();

  if (previousError) {
    throw new Error(formatSupabaseError(previousError));
  }

  if (!previous) {
    throw new Error("Profil pengguna tidak ditemukan.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      subscription_plan: "free",
      subscription_expires_at: null,
    })
    .eq("id", trimmedUserId)
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      throw new Error("Profil pengguna tidak ditemukan.");
    }
    throw new Error(formatSupabaseError(error));
  }

  if (!data) {
    throw new Error("Profil pengguna tidak ditemukan.");
  }

  const previousProfile = previous as UserProfile;
  const updatedProfile = data as UserProfile;

  await syncGuruSubscriptionFromProfile(
    trimmedUserId,
    "free",
    null,
  );

  void logAdminAction({
    adminId: user.id,
    actionType: ADMIN_ACTION_TYPES.UPDATE_SUBSCRIPTION,
    details: {
      description: "Membatalkan langganan pengguna",
      target_user_id: trimmedUserId,
      target_email: updatedProfile.email,
      old_subscription_plan: previousProfile.subscription_plan,
      new_subscription_plan: "free",
      old_subscription_expires_at: previousProfile.subscription_expires_at,
      new_subscription_expires_at: null,
    },
  });

  return updatedProfile;
}

function normalizeUserIds(userIds: string[]): string[] {
  return [...new Set(userIds.map((id) => id.trim()).filter(Boolean))];
}

export interface BulkUsersResult {
  affectedCount: number;
  userIds: string[];
}

/**
 * Perbarui paket langganan banyak user sekaligus.
 */
export async function bulkUpdateSubscriptionPlan(
  userIds: string[],
  plan: PaidSubscriptionPlan,
): Promise<BulkUsersResult> {
  const { supabase, user } = await requireProfileAdmin();
  const ids = normalizeUserIds(userIds);

  if (ids.length === 0) {
    throw new Error("Pilih minimal satu pengguna.");
  }

  if (!isPaidSubscriptionPlan(plan)) {
    throw new Error(
      "Paket langganan tidak valid. Gunakan: 1_month, 3_months, atau 1_year.",
    );
  }

  const subscriptionExpiresAt = calculateExpirationDate(plan);

  const { data: previousRows, error: previousError } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .in("id", ids);

  if (previousError) {
    throw new Error(formatSupabaseError(previousError));
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({
      subscription_plan: plan,
      subscription_expires_at: subscriptionExpiresAt,
    })
    .in("id", ids)
    .select(PROFILE_COLUMNS);

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  const updated = (data ?? []) as UserProfile[];

  await Promise.all(
    updated.map((row) =>
      syncGuruSubscriptionFromProfile(
        row.id,
        plan,
        subscriptionExpiresAt,
      ),
    ),
  );

  void logAdminAction({
    adminId: user.id,
    actionType: ADMIN_ACTION_TYPES.BULK_UPDATE,
    details: {
      description: "Bulk perbarui paket langganan",
      target_user_ids: ids,
      affected_count: updated.length,
      new_subscription_plan: plan,
      new_subscription_expires_at: subscriptionExpiresAt,
      previous_subscriptions: (previousRows ?? []).map((row) => ({
        id: row.id,
        email: row.email,
        subscription_plan: row.subscription_plan,
        subscription_expires_at: row.subscription_expires_at,
      })),
    },
  });

  return {
    affectedCount: updated.length,
    userIds: updated.map((row) => row.id),
  };
}

/**
 * Hapus banyak profil pengguna sekaligus.
 */
export async function bulkDeleteUsers(
  userIds: string[],
): Promise<BulkUsersResult> {
  const { supabase, user } = await requireProfileAdmin();
  const ids = normalizeUserIds(userIds).filter((id) => id !== user.id);

  if (ids.length === 0) {
    throw new Error(
      "Pilih minimal satu pengguna lain. Anda tidak dapat menghapus akun sendiri.",
    );
  }

  const { data: previousRows, error: previousError } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .in("id", ids);

  if (previousError) {
    throw new Error(formatSupabaseError(previousError));
  }

  if (!previousRows?.length) {
    throw new Error("Profil pengguna tidak ditemukan.");
  }

  const { data, error } = await supabase
    .from("profiles")
    .delete()
    .in("id", ids)
    .select("id");

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  const deletedIds = (data ?? []).map((row) => row.id as string);

  void logAdminAction({
    adminId: user.id,
    actionType: ADMIN_ACTION_TYPES.BULK_DELETE,
    details: {
      description: "Bulk hapus profil pengguna",
      target_user_ids: ids,
      affected_count: deletedIds.length,
      deleted_users: (previousRows as UserProfile[]).map((row) => ({
        id: row.id,
        email: row.email,
        full_name: row.full_name,
        role: row.role,
      })),
    },
  });

  return {
    affectedCount: deletedIds.length,
    userIds: deletedIds,
  };
}

export { ADMIN_UNAUTHORIZED_ERROR };

/**
 * Agregat jumlah user per paket dan per role dari tabel profiles.
 */
export async function getProfileAggregates(): Promise<ProfileAggregates> {
  const { supabase } = await requireProfileAdmin();

  const { data, error } = await supabase
    .from("profiles")
    .select("role, subscription_plan");

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  const aggregates = buildEmptyProfileAggregates();
  const rows = data ?? [];
  aggregates.totalUsers = rows.length;

  for (const row of rows) {
    const plan = isSubscriptionPlan(String(row.subscription_plan))
      ? (row.subscription_plan as SubscriptionPlan)
      : "free";
    const role = isProfileRole(String(row.role))
      ? (row.role as ProfileRole)
      : "user";

    const subItem = aggregates.bySubscription.find((item) => item.key === plan);
    if (subItem) subItem.count += 1;

    const roleItem = aggregates.byRole.find((item) => item.key === role);
    if (roleItem) roleItem.count += 1;
  }

  return aggregates;
}
