"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Loader2, PenLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type SignatureUploadFieldProps = {
  id: string;
  label: string;
  hint?: string;
  previewUrl: string | null;
  uploading?: boolean;
  onUpload: (file: File) => Promise<void>;
  onClear?: () => void;
  className?: string;
};

export function SignatureUploadField({
  id,
  label,
  hint = "PNG/JPG/WEBP dengan latar transparan, maks. 2 MB",
  previewUrl,
  uploading = false,
  onUpload,
  onClear,
  className,
}: SignatureUploadFieldProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onUpload(file);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="flex h-20 w-full max-w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed bg-muted/20 px-2">
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={`Pratinjau ${label}`}
              width={180}
              height={72}
              className="max-h-16 w-auto object-contain"
              unoptimized
            />
          ) : (
            <PenLine className="size-8 text-muted-foreground/60" />
          )}
        </div>
        <div className="space-y-2">
          <input
            ref={fileRef}
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={handleChange}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="min-h-10"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <ImagePlus className="mr-2 size-4" />
              )}
              {previewUrl ? "Ganti TTD" : "Unggah TTD"}
            </Button>
            {previewUrl && onClear ? (
              <Button
                type="button"
                variant="ghost"
                className="min-h-10"
                disabled={uploading}
                onClick={onClear}
              >
                Hapus
              </Button>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
    </div>
  );
}
