import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPageProps {
  title: string;
  description: string;
  nextStep: string;
}

export function PlaceholderPage({
  title,
  description,
  nextStep,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Modul dalam pengembangan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Fondasi arsitektur (database, auth, state management) sudah siap.
            Modul CRUD interaktif akan dibangun di iterasi berikutnya.
          </p>
          <p>
            <span className="font-medium text-foreground">Langkah berikutnya: </span>
            {nextStep}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
