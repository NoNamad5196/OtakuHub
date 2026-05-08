import { z } from "zod";
import { inferDatesFromText, todayIso } from "@/lib/date-utils";
import { normalizeEventType } from "@/lib/event-labels";
import type { EventType } from "@/lib/types";

export const extractedEventSchema = z.object({
  title: z.string().min(1),
  eventType: z.enum([
    "goods_release",
    "preorder",
    "cafe",
    "popup",
    "concert",
    "broadcast",
    "birthday",
    "other",
  ]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  location: z.string().nullable().optional(),
  franchiseGuess: z.string().nullable().optional(),
  sourceUrl: z.string().url(),
  confidence: z.number().min(0).max(1),
  warnings: z.array(z.string()).default([]),
});

export type ExtractedEvent = z.infer<typeof extractedEventSchema>;

export type ExtractablePost = {
  title: string;
  content: string;
  originalUrl: string;
  franchiseName?: string | null;
};

function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL || process.env.GOOGLE_AI_MODEL || "gemini-3.1-flash-lite";
}

function getGeminiFallbackModel() {
  return process.env.GEMINI_FALLBACK_MODEL || "gemini-2.5-flash-lite";
}

function buildPrompt(post: ExtractablePost) {
  return [
    "You extract fandom schedule events from public Korean community posts.",
    "Return only valid JSON with keys: title, eventType, startDate, endDate, location, franchiseGuess, sourceUrl, confidence, warnings.",
    "eventType must be one of goods_release, preorder, cafe, popup, concert, broadcast, birthday, other.",
    "Use YYYY-MM-DD dates. If a date is missing, infer conservatively from the post and add a warning.",
    "Do not include private user data. Do not create an event if the text is only a rumor; lower confidence and warn.",
    "",
    `Known franchise: ${post.franchiseName ?? "unknown"}`,
    `Source URL: ${post.originalUrl}`,
    `Post title: ${post.title}`,
    `Post content: ${post.content.slice(0, 4000)}`,
  ].join("\n");
}

function parseJsonFromModelText(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return JSON.parse(fenced ? fenced[1] : trimmed) as unknown;
}

async function callGemini(model: string, post: ExtractablePost) {
  const key = getGeminiApiKey();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
    key,
  )}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: buildPrompt(post) }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 700,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Gemini ${model} failed: ${response.status} ${await response.text()}`);
  }

  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Gemini ${model} returned no text`);
  return extractedEventSchema.parse(parseJsonFromModelText(text));
}

export function heuristicExtractEvent(post: ExtractablePost): ExtractedEvent {
  const text = `${post.title}\n${post.content}`;
  const inferred = inferDatesFromText(text) ?? todayIso();
  const warnings = inferDatesFromText(text)
    ? ["AI key not configured; used local heuristic extraction."]
    : ["AI key not configured; no date found, used today's date as a placeholder."];
  const eventType: EventType = normalizeEventType(text);

  return {
    title: post.title.trim() || "확인 필요한 덕질 일정",
    eventType,
    startDate: inferred,
    endDate: null,
    location: /홍대|합정|서울|부산|온라인/.exec(text)?.[0] ?? null,
    franchiseGuess: post.franchiseName ?? null,
    sourceUrl: post.originalUrl,
    confidence: eventType === "other" ? 0.38 : 0.58,
    warnings,
  };
}

export async function extractEventFromPost(post: ExtractablePost): Promise<ExtractedEvent> {
  if (!getGeminiApiKey()) return heuristicExtractEvent(post);

  try {
    return await callGemini(getGeminiModel(), post);
  } catch (error) {
    const primaryMessage = error instanceof Error ? error.message : String(error);
    try {
      return await callGemini(getGeminiFallbackModel(), post);
    } catch (fallbackError) {
      const extracted = heuristicExtractEvent(post);
      const fallbackMessage =
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
      return {
        ...extracted,
        confidence: Math.min(extracted.confidence, 0.42),
        warnings: [
          ...extracted.warnings,
          `Gemini extraction failed: ${primaryMessage}`,
          `Fallback model failed: ${fallbackMessage}`,
        ],
      };
    }
  }
}
