import { SIGNUP_FULL_ACCESS_PLAN } from "@/lib/auth/signup-access-defaults";
import { isProfileSubscriptionActive } from "@/lib/subscription/profile-access";
import { syncGuruSubscriptionFromProfile } from "@/lib/services/profile-subscription-sync";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateExpirationDate } from "@/utils/subscription";

/**
 * Pastikan user baru memiliki akses penuh (profiles + subscriptions).
 * Idempotent — tidak menimpa langganan aktif yang sudah ada.
 */
export async function ensureSignupFullAccess(authUserId: string): Promise<void> {
  const trimmedId = authUserId.trim();
  if (!trimmedId) return;

  const admin = createAdminClient();

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("role, subscription_plan, subscription_expires_at")
    .eq("id", trimmedId)
    .maybeSingle();

  if (profileError || !profile) return;
  if (profile.role === "admin") return;
  if (isProfileSubscriptionActive(profile.subscription_expires_at)) return;

  const expiresAt = calculateExpirationDate(SIGNUP_FULL_ACCESS_PLAN);
  if (!expiresAt) return;

  const { error: updateError } = await admin
    .from("profiles")
    .update({
      role: "user",
      subscription_plan: SIGNUP_FULL_ACCESS_PLAN,
      subscription_expires_at: expiresAt,
    })
    .eq("id", trimmedId);

  if (updateError) {
    console.error("[ensureSignupFullAccess] profiles:", updateError.message);
    return;
  }

  try {
    await syncGuruSubscriptionFromProfile(
      trimmedId,
      SIGNUP_FULL_ACCESS_PLAN,
      expiresAt,
    );
  } catch (err) {
    console.error(
      "[ensureSignupFullAccess] sync subscription:",
      err instanceof Error ? err.message : err,
    );
  }
}
