import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const flowSteps = [
  {
    step: "1",
    title: "Data Siswa",
    description:
      "Input nama dan NISN per kelas, atau impor langsung dari Excel.",
    output: "Absensi, penilaian, dan rapor",
  },
  {
    step: "2",
    title: "Tujuan Pembelajaran",
    description:
      "Susun TP, indikator capaian, dan rubrik untuk setiap semester.",
    output: "Lembar penilaian formatif dan sumatif",
  },
  {
    step: "3",
    title: "Penilaian & Rapor",
    description:
      "Input nilai per indikator, lalu cetak rapor semester siap pakai.",
    output: "Rekap nilai dan dokumen rapor",
  },
];

export function ZeroRedundancyFlow() {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg">Filosofi Zero Redundancy</CardTitle>
          <Badge variant="secondary">Satu Input, Multi-Output</Badge>
        </div>
        <CardDescription>
          Data siswa dan indikator cukup diinput sekali, lalu dipakai di absensi,
          penilaian, dan rapor.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {flowSteps.map((item) => (
            <div
              key={item.step}
              className="rounded-lg border bg-muted/30 p-4 space-y-2"
            >
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {item.step}
              </div>
              <h3 className="font-medium">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Output: </span>
                {item.output}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
