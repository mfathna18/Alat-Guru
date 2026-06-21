import { requireProfileAdmin } from "@/lib/auth/require-profile-admin";
import { formatSupabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminActionType,
  AdminLogDetails,
  AdminLogEntry,
} from "@/lib/types/admin-log";

export interface LogAdminActionInput {
  adminId: string;
  actionType: AdminActionType;
  details: AdminLogDetails;
}

/**
 * Simpan satu entri riwayat admin ke `public.admin_logs`.
 * Reusable dari Server Actions, Route Handlers, dan service server lainnya.
 *
 * @returns `true` jika berhasil, `false` jika gagal (error dicatat ke console).
 */
export async function logAdminAction({
  adminId,
  actionType,
  details,
}: LogAdminActionInput): Promise<boolean> {
  const trimmedAdminId = adminId?.trim();
  const trimmedActionType = actionType?.trim();

  if (!trimmedAdminId || !trimmedActionType) {
    console.error(
      "[logAdminAction] adminId dan actionType wajib diisi.",
      { adminId, actionType },
    );
    return false;
  }

  try {
    const supabase = await createClient();

    const { error } = await supabase.from("admin_logs").insert({
      admin_id: trimmedAdminId,
      action_type: trimmedActionType,
      details: details ?? {},
    });

    if (error) {
      console.error("[logAdminAction] Gagal menyimpan log admin:", {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        adminId: trimmedAdminId,
        actionType: trimmedActionType,
      });
      return false;
    }

    return true;
  } catch (err) {
    console.error("[logAdminAction] Kesalahan tidak terduga:", err);
    return false;
  }
}

type AdminLogRow = {
  id: string;
  admin_id: string;
  action_type: string;
  details: AdminLogDetails | null;
  created_at: string;
  profiles:
    | {
        full_name: string | null;
        email: string | null;
      }
    | {
        full_name: string | null;
        email: string | null;
      }[]
    | null;
};

function resolveAdminProfile(
  profiles: AdminLogRow["profiles"],
): { full_name: string | null; email: string | null } | null {
  if (!profiles) return null;
  return Array.isArray(profiles) ? (profiles[0] ?? null) : profiles;
}

/**
 * Ambil riwayat aktivitas admin dengan join ke profiles (nama admin).
 * Hanya dapat diakses oleh user dengan role `admin`.
 */
export async function getAdminLogs(): Promise<AdminLogEntry[]> {
  const { supabase } = await requireProfileAdmin();

  const { data, error } = await supabase
    .from("admin_logs")
    .select(
      `
      id,
      admin_id,
      action_type,
      details,
      created_at,
      profiles (
        full_name,
        email
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(formatSupabaseError(error));
  }

  return ((data ?? []) as AdminLogRow[]).map((row) => {
    const admin = resolveAdminProfile(row.profiles);

    return {
      id: row.id,
      adminId: row.admin_id,
      adminName:
        admin?.full_name?.trim() ||
        admin?.email?.trim() ||
        "Admin tidak diketahui",
      adminEmail: admin?.email ?? null,
      actionType: row.action_type,
      details: row.details ?? {},
      createdAt: row.created_at,
    };
  });
}
