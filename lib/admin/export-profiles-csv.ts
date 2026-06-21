import {
  PROFILE_ROLE_LABELS,
  PROFILE_SUBSCRIPTION_LABELS,
  type UserProfile,
} from "@/lib/types/profile";

function escapeCsvCell(value: string) {
  const text = value ?? "";
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatExpiration(value: string | null) {
  if (!value) return "";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

/**
 * Unduh data pengguna saat ini sebagai file CSV di browser.
 */
export function downloadProfilesCsv(users: UserProfile[]) {
  const headers = [
    "nama",
    "email",
    "role",
    "paket_langganan",
    "tanggal_kedaluwarsa",
    "id",
    "updated_at",
  ];

  const rows = users.map((user) =>
    [
      user.full_name ?? "",
      user.email ?? "",
      PROFILE_ROLE_LABELS[user.role],
      PROFILE_SUBSCRIPTION_LABELS[user.subscription_plan],
      formatExpiration(user.subscription_expires_at),
      user.id,
      user.updated_at,
    ]
      .map(escapeCsvCell)
      .join(","),
  );

  const csv = [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
