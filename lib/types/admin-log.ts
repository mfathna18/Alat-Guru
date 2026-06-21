export const ADMIN_ACTION_TYPES = {
  UPDATE_ROLE: "UPDATE_ROLE",
  UPDATE_SUBSCRIPTION: "UPDATE_SUBSCRIPTION",
  UPDATE_USER_STATUS: "UPDATE_USER_STATUS",
  BULK_UPDATE: "BULK_UPDATE",
  BULK_DELETE: "BULK_DELETE",
} as const;

export type AdminActionType =
  | (typeof ADMIN_ACTION_TYPES)[keyof typeof ADMIN_ACTION_TYPES]
  | string;

export interface AdminLog {
  id: string;
  admin_id: string;
  action_type: string;
  details: Record<string, unknown>;
  created_at: string;
}

export type AdminLogDetails = Record<string, unknown>;

export interface AdminLogEntry {
  id: string;
  adminId: string;
  adminName: string;
  adminEmail: string | null;
  actionType: string;
  details: AdminLogDetails;
  createdAt: string;
}
