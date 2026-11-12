"use client";

import { useState } from "react";
import { CORE_OVERVIEW_SYMBOLS } from "@/lib/data/mockProvider";
import { marketData } from "@/lib/data/provider";
import { localReply } from "@/lib/assistant/answer";
import { buildPayload } from "@/lib/assistant/payload";
import { askCompatibleEndpoint } from "@/lib/assistant/remote";
import { useAiSettingsStore } from "@/lib/stores/ai-settings-store";
import { useAnalyzerReadStore } from "@/lib/stores/analyzer-read-store";
import { usePaperStore } from "@/lib/stores/paper-store";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AssistantPage() {
  const hasKey = useAiSettingsStore((s) => s.apiKey.trim().length > 0);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const ask = async () => {
    const settings = useAiSettingsStore.getState();
    const named = CORE_OVERVIEW_SYMBOLS.find((symbol) => question.toUpperCase().includes(symbol));
    const cached = named ? marketData.getQuote(named) : undefined;
    const payload = buildPayload(question, {
      analyzer: useAnalyzerReadStore.getState().read,
      quote:
        cached && cached.quality
          ? { symbol: cached.symbol, quality: cached.quality, source: cached.source }
          : null,
      closedTrades: usePaperStore.getState().closed.map((trade) => ({
        symbol: trade.symbol,
        side: trade.side,
        qty: trade.qty,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        pnl: trade.pnl,
        rMultiple: trade.rMultiple,
      })),
    });
    setError(null);
    setAnswer(null);
    if (!settings.apiKey.trim()) {
      setAnswer(localReply(question, payload).text);
      return;
    }
    setBusy(true);
    const result = await askCompatibleEndpoint({
      baseUrl: settings.baseUrl,
      apiKey: settings.apiKey,
      model: settings.model,
      question,
      payload,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAnswer(result.text);
  };

  return (
    <div>
      <PageHeader
        title="Assistant"
        description="With no API key, answers are quotes from the encyclopedia, academy lessons, and figures already stored on this browser. No model is called."
      />
      <p className="mb-4 text-sm text-secondary" data-testid="assistant-mode">
        {hasKey
          ? "A key is saved in localStorage. A question sends only the local payload to your endpoint. A failed call shows the error and does not invent an answer."
          : "No API key is saved. This path does not call a model."}
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Question</CardTitle>
          <CardDescription>Not a buy or sell instruction and not a promise of profit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            data-testid="assistant-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about a pattern or a lesson"
          />
          <Button data-testid="assistant-ask" disabled={busy} onClick={() => void ask()}>
            {busy ? "Waiting" : "Ask"}
          </Button>
          {error && (
            <p className="text-sm text-down" data-testid="assistant-error">
              {error}
            </p>
          )}
          {answer && (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-secondary" data-testid="assistant-answer">
              {answer}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
