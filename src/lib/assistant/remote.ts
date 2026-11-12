import { promptMessages } from "@/lib/assistant/answer";
import type { AssistantPayload } from "@/lib/assistant/payload";

export function chatCompletionsUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/$/, "");
  if (trimmed.endsWith("/chat/completions")) return trimmed;
  return `${trimmed}/chat/completions`;
}

export function redactSecret(text: string, secret: string): string {
  if (!secret) return text;
  return text.split(secret).join("[redacted]");
}

export async function askCompatibleEndpoint(input: {
  baseUrl: string;
  apiKey: string;
  model: string;
  question: string;
  payload: AssistantPayload;
}): Promise<{ ok: true; text: string } | { ok: false; error: string }> {
  const model = input.model.trim();
  const baseUrl = input.baseUrl.trim();
  const apiKey = input.apiKey.trim();
  if (!apiKey) return { ok: false, error: "No API key is saved, so no request was sent." };
  if (!baseUrl) return { ok: false, error: "Base URL is empty, so no request was sent." };
  if (!model) return { ok: false, error: "Model name is empty, so no request was sent." };

  let response: Response;
  try {
    response = await fetch(chatCompletionsUrl(baseUrl), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: promptMessages(input.question, input.payload),
      }),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Request failed.";
    return { ok: false, error: redactSecret(message, apiKey) };
  }

  const raw = await response.text();
  const safe = redactSecret(raw, apiKey);
  if (!response.ok) {
    return { ok: false, error: `Request failed (${response.status}). ${safe.slice(0, 500)}` };
  }
  try {
    const parsed = JSON.parse(raw) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const text = parsed.choices?.[0]?.message?.content?.trim();
    if (!text) return { ok: false, error: "The endpoint returned no message. No local answer was substituted." };
    return { ok: true, text };
  } catch {
    return { ok: false, error: "The endpoint did not return JSON. No local answer was substituted." };
  }
}
