"use client";

import { MessageCircle, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SUBSCRIPTION_PRICING_PLANS,
  whatsappOrderUrl,
} from "@/lib/billing/subscription-plans";
import { formatIdr } from "@/lib/billing/pricing";
import { cn } from "@/lib/utils";

export function SubscriptionPricingCards() {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight">Daftar Harga</h2>
        <p className="text-sm text-muted-foreground">
          Pilih paket yang sesuai. Order via WhatsApp — aktivasi manual oleh
          admin.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {SUBSCRIPTION_PRICING_PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              "relative flex flex-col overflow-hidden transition-shadow hover:shadow-md",
              plan.popular && "border-primary shadow-sm ring-1 ring-primary/20",
              plan.bestValue && "border-amber-500/60 bg-amber-50/30 dark:bg-amber-950/10",
            )}
          >
            {plan.popular ? (
              <div className="absolute right-3 top-3">
                <Badge className="gap-1 bg-primary text-primary-foreground">
                  <Sparkles className="size-3" />
                  Populer
                </Badge>
              </div>
            ) : null}
            {plan.bestValue ? (
              <div className="absolute right-3 top-3">
                <Badge
                  variant="secondary"
                  className="gap-1 border-amber-500/40 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100"
                >
                  <Sparkles className="size-3" />
                  Paling Hemat
                </Badge>
              </div>
            ) : null}

            <CardHeader className="pb-3 pt-8">
              <CardTitle className="text-base">{plan.label}</CardTitle>
              <CardDescription>{plan.discountLabel}</CardDescription>
              <div className="pt-2">
                <p className="text-3xl font-bold tracking-tight">
                  {formatIdr(plan.totalPrice)}
                </p>
                <p className="text-sm text-muted-foreground">
                  setara {formatIdr(plan.monthlyPrice)}/bulan
                </p>
              </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3 pb-4 text-sm">
              <div className="rounded-lg border bg-muted/30 px-3 py-2.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Harga per bulan</span>
                  <span className="font-medium">{formatIdr(plan.monthlyPrice)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Total normal</span>
                  <span
                    className={cn(
                      plan.savings ? "text-muted-foreground line-through" : "font-medium",
                    )}
                  >
                    {formatIdr(plan.normalTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">Harga per hari</span>
                  <span className="font-medium">{formatIdr(plan.dailyPrice)}</span>
                </div>
              </div>

              <p
                className={cn(
                  "text-center text-xs font-medium",
                  plan.savings
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-muted-foreground",
                )}
              >
                {plan.savingsLabel}
              </p>
            </CardContent>

            <CardFooter className="pt-0">
              <a
                href={whatsappOrderUrl(plan.label)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({
                    variant:
                      plan.popular || plan.bestValue ? "default" : "outline",
                    size: "lg",
                  }),
                  "min-h-11 w-full",
                  plan.bestValue && "bg-amber-600 hover:bg-amber-600/90",
                )}
              >
                <MessageCircle className="mr-2 size-4" />
                Order via WhatsApp
              </a>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="rounded-xl border border-dashed bg-muted/20 px-4 py-3 text-center text-sm text-muted-foreground">
        Butuh bantuan memilih paket?{" "}
        <a
          href={whatsappOrderUrl("langganan")}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Chat admin di WhatsApp
        </a>
      </div>
    </section>
  );
}
