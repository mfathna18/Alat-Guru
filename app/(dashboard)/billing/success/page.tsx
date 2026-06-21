import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function BillingSuccessPage() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle>Pembayaran Diterima</CardTitle>
          <CardDescription>
            Langganan Premium Anda akan segera aktif. Jika belum berubah,
            refresh halaman billing dalam beberapa detik.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Link
            href="/billing"
            className={cn(buttonVariants(), "min-h-11 inline-flex items-center justify-center")}
          >
            Lihat Status Langganan
          </Link>
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "min-h-11 inline-flex items-center justify-center",
            )}
          >
            Ke Dashboard
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
