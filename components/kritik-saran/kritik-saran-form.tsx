"use client";

import * as React from "react";
import { Bug, Lightbulb, MessageSquareText, Send } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  FEEDBACK_CATEGORY_OPTIONS,
  type FeedbackCategory,
  whatsappFeedbackUrl,
} from "@/lib/contact/whatsapp-feedback";
import { cn } from "@/lib/utils";

const CATEGORY_ICONS = {
  bug: Bug,
  saran: Lightbulb,
  lainnya: MessageSquareText,
} as const;

export function KritikSaranForm() {
  const [category, setCategory] = React.useState<FeedbackCategory>("bug");
  const [message, setMessage] = React.useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = message.trim();
    if (trimmed.length < 10) {
      toast.error("Pesan terlalu singkat", {
        description: "Jelaskan minimal 10 karakter agar kami bisa memahami masalahnya.",
      });
      return;
    }

    const url = whatsappFeedbackUrl({ category, message: trimmed });

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Kritik dan Saran
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Laporkan bug, error, atau sampaikan ide fitur baru. Pesan akan
          dikirim ke admin melalui WhatsApp.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kirim Masukan</CardTitle>
          <CardDescription>
            Pilih jenis masukan, tulis detailnya, lalu kirim via WhatsApp.
            Balasan akan dikirim ke nomor yang terdaftar di akun Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium">Jenis masukan</legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {FEEDBACK_CATEGORY_OPTIONS.map((option) => {
                  const Icon = CATEGORY_ICONS[option.value];
                  const selected = category === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCategory(option.value)}
                      className={cn(
                        "flex min-h-24 flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                        selected
                          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                          : "border-border hover:border-primary/40 hover:bg-muted/50",
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-5 shrink-0",
                          selected ? "text-primary" : "text-muted-foreground",
                        )}
                        aria-hidden
                      />
                      <span className="text-sm font-medium">{option.label}</span>
                      <span className="text-xs leading-snug text-muted-foreground">
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="feedback-message">Detail masukan</Label>
              <Textarea
                id="feedback-message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={
                  category === "bug"
                    ? "Contoh: Saat cetak e-rapor di HP, halaman terpotong pada bagian nilai..."
                    : category === "saran"
                      ? "Contoh: Mohon ditambahkan fitur export absensi ke Excel per semester..."
                      : "Tuliskan kritik atau saran Anda di sini..."
                }
                rows={6}
                required
                minLength={10}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/2000 karakter · minimal 10 karakter
              </p>
            </div>

            <Button type="submit" className="w-full sm:w-auto" size="lg">
              <Send className="size-4" aria-hidden />
              Kirim via WhatsApp
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
