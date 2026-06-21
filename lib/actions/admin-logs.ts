"use server";

import {
  getAdminLogs as getAdminLogsService,
  logAdminAction as logAdminActionService,
  type LogAdminActionInput,
} from "@/lib/services/admin-logs";
import type { AdminLogEntry } from "@/lib/types/admin-log";
import { ADMIN_UNAUTHORIZED_ERROR } from "@/lib/services/admin-users";

export type AdminLogsActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function toActionError(err: unknown): AdminLogsActionResult<never> {
  const message =
    err instanceof Error ? err.message : "Terjadi kesalahan. Coba lagi.";

  if (message === ADMIN_UNAUTHORIZED_ERROR) {
    return { ok: false, error: "Unauthorized" };
  }

  return { ok: false, error: message };
}

/**
 * Server Action wrapper untuk `logAdminAction`.
 * Gunakan dari Client Components; untuk kode server lain impor langsung dari
 * `@/lib/services/admin-logs`.
 */
export async function logAdminAction(
  input: LogAdminActionInput,
): Promise<boolean> {
  return logAdminActionService(input);
}

/**
 * Server Action: daftar riwayat aktivitas admin.
 */
export async function getAdminLogs(): Promise<
  AdminLogsActionResult<AdminLogEntry[]>
> {
  try {
    const logs = await getAdminLogsService();
    return { ok: true, data: logs };
  } catch (err) {
    return toActionError(err);
  }
}

export type { LogAdminActionInput };
