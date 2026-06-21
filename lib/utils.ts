import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(err: unknown, fallback = "Terjadi kesalahan."): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    const message = (err as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return fallback;
}

export function isMissingColumnError(err: unknown): boolean {
  const msg = getErrorMessage(err, "").toLowerCase();
  return (
    (msg.includes("could not find") && msg.includes("column")) ||
    (msg.includes("does not exist") &&
      (msg.includes("column") || msg.includes("relation"))) ||
    /column ["'][^"']+["'] of relation/.test(msg)
  );
}

/** Nama kolom dari pesan error Postgres / PostgREST (schema cache). */
export function extractMissingColumnName(err: unknown): string | null {
  const msg = getErrorMessage(err, "");
  const patterns = [
    /could not find the ['"]([^'"]+)['"] column/i,
    /column ["']([^"']+)["'] of relation/i,
    /column ["']([^"']+)["'] does not exist/i,
  ];
  for (const pattern of patterns) {
    const match = msg.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function isSchemaCacheColumnError(err: unknown): boolean {
  const msg = getErrorMessage(err, "").toLowerCase();
  return msg.includes("schema cache") && msg.includes("column");
}
