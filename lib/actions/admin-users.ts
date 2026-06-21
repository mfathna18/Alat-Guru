"use server";

import {
  ADMIN_UNAUTHORIZED_ERROR,
  bulkDeleteUsers as bulkDeleteUsersService,
  bulkUpdateSubscriptionPlan as bulkUpdateSubscriptionPlanService,
  cancelSubscription as cancelSubscriptionService,
  getAllUsers as getAllUsersService,
  getProfileAggregates as getProfileAggregatesService,
  updateUserProfile as updateUserProfileService,
  type BulkUsersResult,
} from "@/lib/services/admin-users";
import type { ProfileAggregates } from "@/lib/types/admin-stats";
import type {
  PaidSubscriptionPlan,
  ProfileRole,
  SubscriptionPlan,
  UserProfile,
} from "@/lib/types/profile";

export type AdminUsersActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toActionError(err: unknown): AdminUsersActionResult<never> {
  const message =
    err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";

  if (message === ADMIN_UNAUTHORIZED_ERROR) {
    return { ok: false, error: "Unauthorized" };
  }

  return { ok: false, error: message };
}

/**
 * Server Action: daftar semua user (tabel profiles).
 */
export async function getAllUsers(): Promise<
  AdminUsersActionResult<UserProfile[]>
> {
  try {
    const users = await getAllUsersService();
    return { ok: true, data: users };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Server Action: ubah role & paket langganan satu user.
 */
export async function updateUserProfile(
  userId: string,
  role: ProfileRole,
  subscriptionPlan: SubscriptionPlan,
): Promise<AdminUsersActionResult<UserProfile>> {
  try {
    const profile = await updateUserProfileService({
      userId,
      role,
      subscriptionPlan,
    });
    return { ok: true, data: profile };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Server Action: batalkan langganan user (free + expires_at null).
 */
export async function handleCancelSubscription(
  userId: string,
): Promise<AdminUsersActionResult<UserProfile>> {
  try {
    const profile = await cancelSubscriptionService(userId);
    return { ok: true, data: profile };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Server Action: bulk perbarui paket langganan.
 */
export async function bulkUpdateSubscriptionPlan(
  userIds: string[],
  plan: PaidSubscriptionPlan,
): Promise<AdminUsersActionResult<BulkUsersResult>> {
  try {
    const result = await bulkUpdateSubscriptionPlanService(userIds, plan);
    return { ok: true, data: result };
  } catch (err) {
    return toActionError(err);
  }
}

/**
 * Server Action: bulk hapus profil pengguna.
 */
export async function bulkDeleteUsers(
  userIds: string[],
): Promise<AdminUsersActionResult<BulkUsersResult>> {
  try {
    const result = await bulkDeleteUsersService(userIds);
    return { ok: true, data: result };
  } catch (err) {
    return toActionError(err);
  }
}

export type { BulkUsersResult };

/**
 * Server Action: agregat statistik profiles (role & paket).
 */
export async function getProfileAggregates(): Promise<
  AdminUsersActionResult<ProfileAggregates>
> {
  try {
    const stats = await getProfileAggregatesService();
    return { ok: true, data: stats };
  } catch (err) {
    return toActionError(err);
  }
}
