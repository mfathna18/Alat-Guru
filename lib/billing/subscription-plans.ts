export const WHATSAPP_ORDER_URL = "http://wa.me/6282127277461";

export interface SubscriptionPricingPlan {
  id: "1_month" | "3_months" | "1_year";
  label: string;
  totalPrice: number;
  monthlyPrice: number;
  normalTotal: number;
  savings: number | null;
  savingsLabel: string;
  discountLabel: string;
  dailyPrice: number;
  popular?: boolean;
  bestValue?: boolean;
}

export const SUBSCRIPTION_PRICING_PLANS: SubscriptionPricingPlan[] = [
  {
    id: "1_month",
    label: "1 Bulan",
    totalPrice: 39_500,
    monthlyPrice: 39_500,
    normalTotal: 39_500,
    savings: null,
    savingsLabel: "Acuan Dasar",
    discountLabel: "Harga Normal",
    dailyPrice: 1_316,
  },
  {
    id: "3_months",
    label: "3 Bulan",
    totalPrice: 99_000,
    monthlyPrice: 33_000,
    normalTotal: 118_500,
    savings: 19_500,
    savingsLabel: "Hemat Rp 19.500",
    discountLabel: "Diskon 16%",
    dailyPrice: 1_100,
    popular: true,
  },
  {
    id: "1_year",
    label: "1 Tahun",
    totalPrice: 289_000,
    monthlyPrice: 24_083,
    normalTotal: 474_000,
    savings: 185_000,
    savingsLabel: "Hemat Rp 185.000",
    discountLabel: "Diskon 39%",
    dailyPrice: 791,
    bestValue: true,
  },
];

export function whatsappOrderUrl(planLabel: string): string {
  const text = encodeURIComponent(
    `Halo, saya ingin order paket ${planLabel} Alat Guru.`,
  );
  return `${WHATSAPP_ORDER_URL}?text=${text}`;
}
