import Link from "next/link";
import { PATTERNS } from "@/lib/content/patterns";
import { SCAN_RULES } from "@/lib/analysis/scan";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function EncyclopediaPage() {
  return (
    <div>
      <PageHeader
        title="Pattern Encyclopedia"
        description="Educational definitions. Illustrations are not live charts and not signals."
      />
      <div className="grid gap-3 md:grid-cols-2">
        {PATTERNS.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex flex-wrap gap-1.5">
                <Badge>{p.kind}</Badge>
                <Badge variant="muted">{p.bias}</Badge>
              </div>
              <CardTitle>{p.name}</CardTitle>
              <CardDescription>Illustration: schematic only — not market data.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-[13px] leading-relaxed text-secondary">
              <p>{p.description}</p>
              <p>
                <span className="font-medium text-primary">Invalidation: </span>
                {p.invalidation}
              </p>
              {p.scannerRuleId ? (
                <p>
                  <Link href={`/dashboard/scanner?rule=${p.scannerRuleId}`} className="text-accent">
                    Scanner rule: {SCAN_RULES[p.scannerRuleId].label}
                  </Link>
                  {p.scannerNote ? ` ${p.scannerNote}` : ""}
                </p>
              ) : (
                <p>No scanner rule flags this pattern yet.</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
