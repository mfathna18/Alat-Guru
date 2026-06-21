interface RaporWatermarkProps {
  enabled: boolean;
  logoUrl?: string | null;
}

export function RaporWatermark({ enabled, logoUrl }: RaporWatermarkProps) {
  if (!enabled || !logoUrl) return null;

  return (
    <div className="rapor-watermark-layer" aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoUrl} alt="" crossOrigin="anonymous" />
    </div>
  );
}
