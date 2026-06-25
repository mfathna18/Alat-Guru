import type { SubscriptionPlan } from "@/utils/subscription";

/** Paket default untuk user baru — akses penuh otomatis tanpa approval admin. */
export const SIGNUP_FULL_ACCESS_PLAN: SubscriptionPlan = "1_year";

/** Durasi akses penuh saat registrasi (hari). Selaras dengan migration 028. */
export const SIGNUP_FULL_ACCESS_DAYS = 365;
