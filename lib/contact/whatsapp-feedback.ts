import { WHATSAPP_ORDER_URL } from "@/lib/billing/subscription-plans";

export type FeedbackCategory = "bug" | "saran" | "lainnya";

export const FEEDBACK_CATEGORY_OPTIONS: {
  value: FeedbackCategory;
  label: string;
  description: string;
}[] = [
  {
    value: "bug",
    label: "Bug / Error",
    description: "Laporkan masalah teknis atau fitur yang tidak berjalan",
  },
  {
    value: "saran",
    label: "Saran Fitur",
    description: "Usulkan fitur baru atau perbaikan yang diinginkan",
  },
  {
    value: "lainnya",
    label: "Kritik & Saran",
    description: "Masukan umum tentang pengalaman memakai Alat Guru",
  },
];

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: "Laporan Bug / Error",
  saran: "Saran Fitur Baru",
  lainnya: "Kritik & Saran Umum",
};

export function whatsappFeedbackUrl(params: {
  category: FeedbackCategory;
  message: string;
  userName?: string;
  userEmail?: string;
  pageUrl?: string;
}): string {
  const trimmed = params.message.trim();
  const lines = [
    "Halo Admin Alat Guru,",
    "",
    `*${CATEGORY_LABELS[params.category]}*`,
    "",
    trimmed,
  ];

  if (params.userName || params.userEmail) {
    lines.push("", "---", "Dari:");
    if (params.userName) lines.push(`Nama: ${params.userName}`);
    if (params.userEmail) lines.push(`Email: ${params.userEmail}`);
  }

  if (params.pageUrl) {
    lines.push(`Halaman: ${params.pageUrl}`);
  }

  const text = encodeURIComponent(lines.join("\n"));
  return `${WHATSAPP_ORDER_URL}?text=${text}`;
}
