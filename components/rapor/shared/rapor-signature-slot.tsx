import { cn } from "@/lib/utils";

type RaporSignatureSlotProps = {
  url?: string | null;
  gapClassName: string;
  imgClassName?: string;
};

/** Ruang tanda tangan rapor — gambar jika ada, garis kosong jika belum diunggah. */
export function RaporSignatureSlot({
  url,
  gapClassName,
  imgClassName = "rapor-signature-img",
}: RaporSignatureSlotProps) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className={cn(imgClassName, gapClassName)}
      />
    );
  }

  return <span className={gapClassName} aria-hidden="true" />;
}
