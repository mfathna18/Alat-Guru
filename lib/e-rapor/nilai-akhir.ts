export interface BobotNa {
  formatif: number;
  sumatifLm: number;
  sas: number;
}

export const DEFAULT_BOBOT: BobotNa = {
  formatif: 30,
  sumatifLm: 40,
  sas: 30,
};

export function hitungNilaiAkhir(
  nilaiFormatif: number | null,
  nilaiSumatifLm: number | null,
  nilaiSas: number | null,
  bobot: BobotNa = DEFAULT_BOBOT,
): number | null {
  const parts: { value: number | null; weight: number }[] = [
    { value: nilaiFormatif, weight: bobot.formatif },
    { value: nilaiSumatifLm, weight: bobot.sumatifLm },
    { value: nilaiSas, weight: bobot.sas },
  ];

  let weightedSum = 0;
  let totalWeight = 0;

  for (const p of parts) {
    if (p.value != null) {
      weightedSum += p.value * p.weight;
      totalWeight += p.weight;
    }
  }

  if (totalWeight === 0) return null;
  return Math.round((weightedSum / totalWeight) * 100) / 100;
}

export function rataAngka(values: (number | null)[]): number | null {
  const valid = values.filter((v): v is number => v != null);
  if (valid.length === 0) return null;
  const sum = valid.reduce((a, b) => a + b, 0);
  return Math.round((sum / valid.length) * 100) / 100;
}
