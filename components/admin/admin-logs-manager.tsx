"use client";

import * as React from "react";
import { ClipboardList, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { getAdminLogs } from "@/lib/actions/admin-logs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { AdminLogEntry } from "@/lib/types/admin-log";
import { cn } from "@/lib/utils";

interface AdminLogsManagerProps {
  initialLogs: AdminLogEntry[];
}

function formatDateTime(value: string) {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatLogDetails(details: AdminLogEntry["details"]) {
  if (typeof details.description === "string" && details.description.trim()) {
    return details.description.trim();
  }

  try {
    const text = JSON.stringify(details);
    return text.length > 240 ? `${text.slice(0, 240)}…` : text;
  } catch {
    return "—";
  }
}

export function AdminLogsManager({ initialLogs }: AdminLogsManagerProps) {
  const [logs, setLogs] = React.useState(initialLogs);
  const [loading, setLoading] = React.useState(false);

  async function refreshLogs() {
    setLoading(true);
    try {
      const result = await getAdminLogs();
      if (!result.ok) {
        toast.error(
          result.error === "Unauthorized"
            ? "Akses admin ditolak."
            : result.error,
        );
        return;
      }
      setLogs(result.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ClipboardList className="size-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Riwayat Admin
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Audit trail aktivitas admin dari tabel{" "}
            <code className="text-xs">admin_logs</code>.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="shrink-0"
          disabled={loading}
          onClick={() => void refreshLogs()}
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
          <CardTitle className="text-base">Log Aktivitas</CardTitle>
          <CardDescription>
            {logs.length} entri · diurutkan dari yang terbaru
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <p className="px-6 pb-6 text-sm text-muted-foreground">
              Belum ada riwayat aktivitas admin.
            </p>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40 text-left text-xs text-muted-foreground">
                      <th className="px-6 py-3 font-medium">Tanggal/Waktu</th>
                      <th className="px-4 py-3 font-medium">Nama Admin</th>
                      <th className="px-4 py-3 font-medium">Tipe Aksi</th>
                      <th className="px-6 py-3 font-medium">Detail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b align-top last:border-b-0 hover:bg-muted/20"
                      >
                        <td className="whitespace-nowrap px-6 py-3 text-muted-foreground">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{log.adminName}</div>
                          {log.adminEmail ? (
                            <div className="text-xs text-muted-foreground">
                              {log.adminEmail}
                            </div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {log.actionType}
                          </code>
                        </td>
                        <td className="max-w-md px-6 py-3 text-muted-foreground">
                          <p className="whitespace-pre-wrap break-words">
                            {formatLogDetails(log.details)}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-3 p-4 md:hidden">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-lg border bg-card p-4 shadow-xs"
                  >
                    <div className="mb-2 text-xs text-muted-foreground">
                      {formatDateTime(log.createdAt)}
                    </div>
                    <div className="mb-1 font-medium">{log.adminName}</div>
                    {log.adminEmail ? (
                      <p className="mb-2 text-xs text-muted-foreground">
                        {log.adminEmail}
                      </p>
                    ) : null}
                    <code
                      className={cn(
                        "mb-2 inline-block rounded bg-muted px-1.5 py-0.5 text-xs",
                      )}
                    >
                      {log.actionType}
                    </code>
                    <p className="text-sm text-muted-foreground">
                      {formatLogDetails(log.details)}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
