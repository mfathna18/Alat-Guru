"use client";

import * as React from "react";
import {
  ChevronDown,
  Download,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { downloadProfilesCsv } from "@/lib/admin/export-profiles-csv";
import {
  bulkDeleteUsers,
  bulkUpdateSubscriptionPlan,
  getAllUsers,
  handleCancelSubscription,
  updateUserProfile,
} from "@/lib/actions/admin-users";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import {
  PAID_SUBSCRIPTION_PLANS,
  PROFILE_ROLE_LABELS,
  PROFILE_ROLES,
  PROFILE_SUBSCRIPTION_LABELS,
  isSubscriptionPlan,
  type PaidSubscriptionPlan,
  type ProfileRole,
  type SubscriptionPlan,
  type UserProfile,
} from "@/lib/types/profile";
import { cn } from "@/lib/utils";

interface AdminUsersManagerProps {
  initialUsers: UserProfile[];
}

const checkboxClassName =
  "size-4 shrink-0 rounded border border-input accent-primary";

const BULK_PLAN_OPTIONS: Array<{
  plan: PaidSubscriptionPlan;
  label: string;
}> = [
  { plan: "1_month", label: "1 Bulan" },
  { plan: "3_months", label: "3 Bulan" },
  { plan: "1_year", label: "1 Tahun" },
];

const CANCEL_PLAN_OPTION = {
  value: "free" as const,
  label: "Free / Batalkan Langganan",
};

function subscriptionPlanLabel(plan: SubscriptionPlan) {
  return plan === "free" ? "Free / Read-Only" : PROFILE_SUBSCRIPTION_LABELS[plan];
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function roleBadgeVariant(role: ProfileRole) {
  return role === "admin" ? ("default" as const) : ("outline" as const);
}

function planBadgeVariant(plan: SubscriptionPlan) {
  if (plan === "1_year") return "default" as const;
  if (plan === "3_months" || plan === "1_month") return "secondary" as const;
  return "outline" as const;
}

function isExpired(expiresAt: string | null) {
  if (!expiresAt) return true;
  const date = new Date(expiresAt);
  return Number.isNaN(date.getTime()) || date <= new Date();
}

function hasActiveSubscription(user: UserProfile) {
  if (user.subscription_plan === "free") return false;
  if (!user.subscription_expires_at) return false;
  const date = new Date(user.subscription_expires_at);
  return !Number.isNaN(date.getTime()) && date > new Date();
}

export function AdminUsersManager({ initialUsers }: AdminUsersManagerProps) {
  const [users, setUsers] = React.useState(initialUsers);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [bulkRunning, setBulkRunning] = React.useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = React.useState(false);
  const [cancelTarget, setCancelTarget] = React.useState<UserProfile | null>(
    null,
  );
  const [cancelling, setCancelling] = React.useState(false);
  const [editing, setEditing] = React.useState<UserProfile | null>(null);
  const [draftRole, setDraftRole] = React.useState<ProfileRole>("user");
  const [draftPlan, setDraftPlan] = React.useState<SubscriptionPlan>("1_month");

  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected =
    users.length > 0 && users.every((user) => selectedSet.has(user.id));
  const someSelected = selectedIds.length > 0;

  const roleOptions = PROFILE_ROLES.map((role) => ({
    value: role,
    label: PROFILE_ROLE_LABELS[role],
  }));

  const planOptions = [
    CANCEL_PLAN_OPTION,
    ...PAID_SUBSCRIPTION_PLANS.map((plan) => ({
      value: plan,
      label: PROFILE_SUBSCRIPTION_LABELS[plan],
    })),
  ];

  function toggleUser(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      if (checked) {
        return prev.includes(id) ? prev : [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? users.map((user) => user.id) : []);
  }

  async function refreshUsers() {
    setLoading(true);
    try {
      const result = await getAllUsers();

      if (!result.ok) {
        toast.error(
          result.error === "Unauthorized"
            ? "Akses admin ditolak."
            : result.error,
        );
        return;
      }

      setUsers(result.data);
      setSelectedIds((prev) =>
        prev.filter((id) => result.data.some((user) => user.id === id)),
      );
    } finally {
      setLoading(false);
    }
  }

  function handleExportCsv() {
    if (users.length === 0) {
      toast.error("Tidak ada data untuk diekspor.");
      return;
    }
    downloadProfilesCsv(users);
    toast.success(`${users.length} pengguna diekspor ke CSV.`);
  }

  function openEdit(user: UserProfile) {
    setEditing(user);
    setDraftRole(user.role);
    setDraftPlan(
      isSubscriptionPlan(user.subscription_plan)
        ? user.subscription_plan
        : "free",
    );
  }

  function closeEdit() {
    if (saving) return;
    setEditing(null);
  }

  async function handleSave() {
    if (!editing) return;

    setSaving(true);
    try {
      const result = await updateUserProfile(
        editing.id,
        draftRole,
        draftPlan,
      );

      if (!result.ok) {
        toast.error(
          result.error === "Unauthorized"
            ? "Akses admin ditolak."
            : result.error,
        );
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === result.data.id ? result.data : u)),
      );
      const message =
        result.data.subscription_plan === "free"
          ? `Langganan ${result.data.email ?? "pengguna"} dibatalkan.`
          : `Profil ${result.data.email ?? "pengguna"} diperbarui.`;
      toast.success(message);
      setEditing(null);
      await refreshUsers();
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmCancelSubscription() {
    if (!cancelTarget) return;

    setCancelling(true);
    try {
      const result = await handleCancelSubscription(cancelTarget.id);

      if (!result.ok) {
        toast.error(
          result.error === "Unauthorized"
            ? "Akses admin ditolak."
            : result.error,
        );
        return;
      }

      setUsers((prev) =>
        prev.map((u) => (u.id === result.data.id ? result.data : u)),
      );
      toast.success(
        `Langganan ${result.data.email ?? "pengguna"} dibatalkan. Akses kembali Read-Only.`,
      );
      setCancelTarget(null);
      await refreshUsers();
    } finally {
      setCancelling(false);
    }
  }

  async function handleBulkUpdatePlan(plan: PaidSubscriptionPlan) {
    if (!someSelected) return;

    setBulkRunning(true);
    try {
      const result = await bulkUpdateSubscriptionPlan(selectedIds, plan);
      if (!result.ok) {
        toast.error(
          result.error === "Unauthorized"
            ? "Akses admin ditolak."
            : result.error,
        );
        return;
      }

      toast.success(
        `${result.data.affectedCount} pengguna diperbarui ke paket ${PROFILE_SUBSCRIPTION_LABELS[plan]}.`,
      );
      setSelectedIds([]);
      await refreshUsers();
    } finally {
      setBulkRunning(false);
    }
  }

  async function handleBulkDelete() {
    if (!someSelected) return;

    setBulkRunning(true);
    try {
      const result = await bulkDeleteUsers(selectedIds);
      if (!result.ok) {
        toast.error(
          result.error === "Unauthorized"
            ? "Akses admin ditolak."
            : result.error,
        );
        return;
      }

      toast.success(`${result.data.affectedCount} profil pengguna dihapus.`);
      setSelectedIds([]);
      setConfirmBulkDelete(false);
      await refreshUsers();
    } finally {
      setBulkRunning(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Users className="size-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Manajemen User
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Kelola role dan paket langganan semua pengguna terdaftar.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          disabled={loading}
          onClick={() => void refreshUsers()}
        >
          {loading ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 size-4" />
          )}
          Muat ulang
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-4" />
                Daftar Pengguna
              </CardTitle>
              <CardDescription>
                {users.length} pengguna terdaftar di tabel{" "}
                <code className="text-xs">profiles</code>.
                {someSelected ? (
                  <span className="ml-1 font-medium text-foreground">
                    · {selectedIds.length} dipilih
                  </span>
                ) : null}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={users.length === 0}
                onClick={handleExportCsv}
              >
                <Download className="mr-1.5 size-3.5" />
                Export CSV
              </Button>
              {someSelected ? (
                <>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      disabled={bulkRunning}
                      className={cn(
                        "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-input bg-background px-3 text-sm font-medium shadow-xs",
                        "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "disabled:pointer-events-none disabled:opacity-50",
                      )}
                    >
                      {bulkRunning ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : null}
                      Perbarui Durasi Langganan
                      <ChevronDown className="size-3.5 opacity-50" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {BULK_PLAN_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.plan}
                          onClick={() => void handleBulkUpdatePlan(option.plan)}
                        >
                          {option.label}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={bulkRunning}
                    onClick={() => setConfirmBulkDelete(true)}
                  >
                    <Trash2 className="mr-1.5 size-3.5" />
                    Hapus User
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              Belum ada data pengguna.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="w-10 px-4 py-3">
                        <input
                          type="checkbox"
                          className={checkboxClassName}
                          checked={allSelected}
                          onChange={(e) => toggleSelectAll(e.target.checked)}
                          aria-label="Pilih semua pengguna"
                        />
                      </th>
                      <th className="px-4 py-3 font-medium">Nama</th>
                      <th className="px-4 py-3 font-medium">Email</th>
                      <th className="px-4 py-3 font-medium">Role</th>
                      <th className="px-4 py-3 font-medium">Paket Langganan</th>
                      <th className="px-4 py-3 font-medium">
                        Tanggal Kedaluwarsa
                      </th>
                      <th className="px-6 py-3 text-right font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className={cn(
                          "border-b last:border-b-0 hover:bg-muted/20",
                          selectedSet.has(user.id) && "bg-muted/30",
                        )}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            className={checkboxClassName}
                            checked={selectedSet.has(user.id)}
                            onChange={(e) =>
                              toggleUser(user.id, e.target.checked)
                            }
                            aria-label={`Pilih ${user.email ?? user.id}`}
                          />
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {user.full_name ?? "—"}
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                          {user.email ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={roleBadgeVariant(user.role)}>
                            {PROFILE_ROLE_LABELS[user.role]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={planBadgeVariant(user.subscription_plan)}>
                            {subscriptionPlanLabel(user.subscription_plan)}
                          </Badge>
                        </td>
                        <td
                          className={cn(
                            "whitespace-nowrap px-4 py-3",
                            isExpired(user.subscription_expires_at)
                              ? "text-muted-foreground"
                              : "text-foreground",
                          )}
                        >
                          {formatDateTime(user.subscription_expires_at)}
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="inline-flex items-center justify-end gap-1">
                            {hasActiveSubscription(user) ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => setCancelTarget(user)}
                              >
                                <X className="mr-1 size-3.5" />
                                Cabut Akses
                              </Button>
                            ) : null}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => openEdit(user)}
                            >
                              <Pencil className="mr-1.5 size-3.5" />
                              Edit
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 p-4 md:hidden">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className={checkboxClassName}
                    checked={allSelected}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                  Pilih semua
                </label>
                {users.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      "rounded-lg border bg-card p-4 shadow-xs",
                      selectedSet.has(user.id) && "border-primary/40 bg-muted/20",
                    )}
                  >
                    <label className="mb-3 flex items-start gap-2">
                      <input
                        type="checkbox"
                        className={cn(checkboxClassName, "mt-0.5")}
                        checked={selectedSet.has(user.id)}
                        onChange={(e) =>
                          toggleUser(user.id, e.target.checked)
                        }
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">
                          {user.full_name ?? "Tanpa nama"}
                        </div>
                        <p className="truncate text-sm text-muted-foreground">
                          {user.email ?? "—"}
                        </p>
                      </div>
                    </label>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <Badge variant={roleBadgeVariant(user.role)}>
                        {PROFILE_ROLE_LABELS[user.role]}
                      </Badge>
                      <Badge variant={planBadgeVariant(user.subscription_plan)}>
                        {subscriptionPlanLabel(user.subscription_plan)}
                      </Badge>
                    </div>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Kedaluwarsa: {formatDateTime(user.subscription_expires_at)}
                    </p>
                    <div className="flex gap-2">
                      {hasActiveSubscription(user) ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setCancelTarget(user)}
                        >
                          <X className="mr-1.5 size-3.5" />
                          Cabut Akses
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className={hasActiveSubscription(user) ? "flex-1" : "w-full"}
                        onClick={() => openEdit(user)}
                      >
                        <Pencil className="mr-1.5 size-3.5" />
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={editing !== null} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>
              {editing?.full_name ?? editing?.email ?? "Pengguna"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <FilterDropdown
              label="Role"
              value={draftRole}
              options={roleOptions}
              onChange={(value) => setDraftRole(value as ProfileRole)}
            />
            <FilterDropdown
              label="Paket Langganan"
              value={draftPlan}
              options={planOptions}
              onChange={(value) => setDraftPlan(value as SubscriptionPlan)}
            />
            {editing ? (
              <p className="text-xs text-muted-foreground">
                Tanggal kedaluwarsa saat ini:{" "}
                {formatDateTime(editing.subscription_expires_at)}
              </p>
            ) : null}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={saving}
              onClick={closeEdit}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.length} pengguna?</AlertDialogTitle>
            <AlertDialogDescription>
              Profil di tabel <code>profiles</code> akan dihapus permanen.
              Akun Auth Supabase tidak ikut terhapus otomatis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkRunning}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={bulkRunning}
              onClick={(e) => {
                e.preventDefault();
                void handleBulkDelete();
              }}
            >
              {bulkRunning ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && !cancelling && setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan langganan?</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin membatalkan langganan user ini? Akses mereka akan
              langsung kembali menjadi Read-Only.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={cancelling}
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleConfirmCancelSubscription();
              }}
            >
              {cancelling ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Batalkan Langganan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
