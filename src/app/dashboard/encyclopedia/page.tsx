import Link from "next/link";
import { PATTERNS } from "@/lib/content/patterns";
import { SCAN_RULES } from "@/lib/analysis/scan";
import { PatternDiagram } from "@/components/encyclopedia/pattern-diagram";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const BIAS: Record<string, { label: string; variant: "success" | "danger" | "muted" }> = {
  bull: { label: "Bullish", variant: "success" },
  bear: { label: "Bearish", variant: "danger" },
  both: { label: "Either side", variant: "muted" },
};

export default function EncyclopediaPage() {
  const charted = PATTERNS.filter((p) => p.detail && p.diagram);
  const rest = PATTERNS.filter((p) => !p.detail);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pattern Encyclopedia"
        description="Educational definitions. Diagrams are geometric schematics, not price charts and not signals."
      />
      <div className="grid gap-3">
        {charted.map((p) => {
          const bias = BIAS[p.bias];
          return (
            <Card key={p.id} id={p.id}>
              <CardHeader>
                <div className="flex flex-wrap gap-1.5">
                  <Badge>{p.kind}</Badge>
                  <Badge variant={bias.variant}>{bias.label}</Badge>
                </div>
                <CardTitle>{p.name}</CardTitle>
                <CardDescription>{p.description}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-[280px_1fr]">
                {p.diagram && <PatternDiagram id={p.diagram} />}
                {p.detail && (
                  <div className="space-y-2 text-[13px] leading-relaxed text-secondary">
                    <p>
                      <span className="font-medium text-primary">Formation: </span>
                      {p.detail.formation}
                    </p>
                    <p>
                      <span className="font-medium text-primary">Confirmation: </span>
                      {p.detail.confirmation}
                    </p>
                    <p>
                      <span className="font-medium text-primary">Entry considerations: </span>
                      {p.detail.entry}
                    </p>
                    <p>
                      <span className="font-medium text-primary">Invalidation: </span>
                      {p.invalidation}
                    </p>
                    <p>
                      <span className="font-medium text-primary">Common mistake: </span>
                      {p.detail.mistake}
                    </p>
                    <p>
                      <span className="font-medium text-primary">Reliability: </span>
                      {p.detail.reliability}
                    </p>
                    {p.scannerRuleId && (
                      <p>
                        <Link href={`/dashboard/scanner?rule=${p.scannerRuleId}`} className="text-accent">
                          Scanner rule: {SCAN_RULES[p.scannerRuleId].label}
                        </Link>
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {rest.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <div className="flex flex-wrap gap-1.5">
                <Badge>{p.kind}</Badge>
                <Badge variant="muted">{BIAS[p.bias].label}</Badge>
              </div>
              <CardTitle>{p.name}</CardTitle>
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
