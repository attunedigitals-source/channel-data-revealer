import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchWithTimeout } from "./server-config";

// AI generation calls can legitimately take a while; still bound them so a stalled upstream can't hang a request forever.
const aiFetch = (url: string, init?: RequestInit) => fetchWithTimeout(url, init, 60_000);

export interface DiagnosticRatings {
  interest: number; // 1-5
  curiosity: number; // 1-5
  specificity: number; // 1-5
  stakes: number; // 1-5
  visualPotential: number; // 1-5
  credibility: number; // 1-5
  storyPotential: number; // 1-5
  audienceRelevance: number; // 1-5
}

export type ClickMotivationType = "KNOW" | "SEE" | "UNDERSTAND" | "EXPERIENCE";

export interface PsychologyInputItem {
  id?: string | undefined;
  num?: number | undefined;
  factPremise: string;
  angle: string;
  code?: string | undefined;
  pattern?: string | undefined;
  workingTitle: string;
  topic?: string | undefined;
}

export interface PsychologyAnalysisResult {
  id: string;
  num: number;
  factPremise: string;
  angle: string;
  code: string;
  pattern: string;
  workingTitle: string;
  targetViewer: string;
  clickMotivation: ClickMotivationType;
  informationGap: string;
  stakes: string;
  visualHook: string;
  titlePromise: string;
  diagnosticRatings: DiagnosticRatings;
  diagnosticRatingsText: string;
}

const AnalyzePsychologyInput = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      num: z.number().optional(),
      factPremise: z.string().trim().min(1),
      angle: z.string().trim().min(1),
      code: z.string().trim().optional(),
      pattern: z.string().trim().optional(),
      workingTitle: z.string().trim().min(1),
      topic: z.string().trim().optional(),
    }),
  ).min(1),
  aiApiKey: z.string().trim().optional(),
});

// Format ratings as multiline text for Excel/CSV export
export function formatRatingsText(r: DiagnosticRatings): string {
  return [
    `Interest: ${r.interest}`,
    `Curiosity: ${r.curiosity}`,
    `Specificity: ${r.specificity}`,
    `Stakes: ${r.stakes}`,
    `Visual Potential: ${r.visualPotential}`,
    `Credibility: ${r.credibility}`,
    `Story Potential: ${r.storyPotential}`,
    `Audience Relevance: ${r.audienceRelevance}`,
  ].join("\r\n");
}

const NOT_RETURNED = "Not returned by the AI.";

/** Clamp an AI-provided rating to 1-5. Missing/invalid becomes 0 = "not rated" (never a flattering default). */
function toRating(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n) : 0;
}

const UNRATED: DiagnosticRatings = {
  interest: 0,
  curiosity: 0,
  specificity: 0,
  stakes: 0,
  visualPotential: 0,
  credibility: 0,
  storyPotential: 0,
  audienceRelevance: 0,
};

/**
 * Used when no AI analysis is available. It deliberately assigns NO scores
 * and writes NO analysis. Earlier versions gave every topic the same
 * near-perfect ratings (5/5/4/4/5/5/4/5) and template text, which made bad
 * ideas look as strong as good ones. A topic-selection tool must not do that.
 */
export function analyzePsychologyUnrated(items: PsychologyInputItem[]): PsychologyAnalysisResult[] {
  const NA = "Not analyzed \u2014 add an AI key in API Settings.";
  return items.map((item, idx) => {
    const num = item.num || idx + 1;
    return {
      id: item.id || `psych-${num}-${Date.now()}`,
      num,
      factPremise: item.factPremise.trim(),
      angle: item.angle.trim(),
      code: (item.code || "").toUpperCase(),
      pattern: item.pattern || "",
      workingTitle: item.workingTitle.trim(),
      targetViewer: NA,
      clickMotivation: "UNDERSTAND",
      informationGap: NA,
      stakes: NA,
      visualHook: NA,
      titlePromise: NA,
      diagnosticRatings: { ...UNRATED },
      diagnosticRatingsText: "Not rated",
    };
  });
}

// AI Batch Analyzer for Audience Psychology
async function analyzePsychologyAiBatch(
  items: PsychologyInputItem[],
  geminiKey?: string,
  openAiKey?: string,
  lovableKey?: string,
): Promise<PsychologyAnalysisResult[] | null> {
  const systemPrompt = `You are a master YouTube audience psychologist and packaging strategist.
Your framework:
"AUDIENCE PSYCHOLOGY & THE CLICK"

CORE CLICK MODEL:
CLICK = INTEREST × CURIOSITY × RELEVANCE × TRUST

THE 4 CLICK MOTIVATIONS:
1. KNOW: Viewer wants information or technique (e.g. "How Do Vaccines Actually Train Your Immune System?").
2. SEE: Viewer wants to see something extraordinary or visually mesmerizing (e.g. "Inside the World's Deepest Underground City").
3. UNDERSTAND: Viewer knows the concept but wants the underlying mechanism/paradox explained (e.g. "Why Has Roman Concrete Survived for 2,000 Years?").
4. EXPERIENCE: Viewer wants to mentally simulate or feel the situation firsthand (e.g. "What Would Happen If You Spent 24 Hours Near a Black Hole?").

INFORMATION GAP:
Curiosity is the gap between what I know and what I want to know (KNOWN → UNKNOWN → ANSWER). It MUST be closable, not confusion or sensational clickbait.

STAKES:
Why does the answer matter? (Classify as Human, Historical, Scientific, Technological, Mystery, Environmental, or Personal).

VISUAL HOOK:
What "Mental Movie" should the viewer immediately imagine? Vivid cinematic imagery that can be executed in generative filmmaking (Google Flow).

TITLE PROMISE:
What exact contract/promise does the title make to the viewer?

DIAGNOSTIC RATINGS (Score each 1 to 5):
- Interest (1-5): Is the subject naturally interesting?
- Curiosity (1-5): Is there a strong, closable information gap?
- Specificity (1-5): Is the idea concrete rather than vague?
- Stakes (1-5): Does the answer matter?
- Visual Potential (1-5): Can we create compelling visuals?
- Credibility (1-5): Is the premise factually defensible?
- Story Potential (1-5): Can this become a journey rather than a list of facts?
- Audience Relevance (1-5): Is there a recognizable audience that would care?
CRITICAL: Do NOT sum these numbers. They are diagnostic radar signals to spot weaknesses.`;

  const userPrompt = `Perform Audience Psychology and The Click analysis for the following video packaging ideas:
${items
  .map(
    (item, idx) =>
      `Item #${idx + 1}:
- Working Title: "${item.workingTitle}"
- Fact / Premise: "${item.factPremise}"
- Angle: "${item.angle}"
- Code: "${item.code || 'Q'}" (${item.pattern || 'Curiosity Pattern'})`,
  )
  .join("\n\n")}

Return a valid JSON array of objects conforming to this schema:
[
  {
    "num": 1,
    "targetViewer": "Specific demographic/psychographic profile (1-2 sentences)",
    "clickMotivation": "KNOW" | "SEE" | "UNDERSTAND" | "EXPERIENCE",
    "informationGap": "The precise closable curiosity gap: What does the viewer not know? (1-2 sentences)",
    "stakes": "Why does the answer matter? Mention stake category (1-2 sentences)",
    "visualHook": "The immediate mental movie / imagery triggered (1-2 sentences)",
    "titlePromise": "The exact contract/journey the video promises (1-2 sentences)",
    "diagnosticRatings": {
      "interest": 5,
      "curiosity": 5,
      "specificity": 5,
      "stakes": 4,
      "visualPotential": 5,
      "credibility": 5,
      "storyPotential": 5,
      "audienceRelevance": 5
    }
  }
]`;

  // 1. OpenAI
  if (openAiKey) {
    try {
      const res = await aiFetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openAiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.4,
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const list = Array.isArray(parsed) ? parsed : parsed.results || parsed.items || parsed.analyses || [];
          if (Array.isArray(list) && list.length > 0) {
            return items.map((item, idx) => {
              const ai = list[idx] || {};
              const ratings: DiagnosticRatings = {
                interest: toRating(ai.diagnosticRatings?.interest),
                curiosity: toRating(ai.diagnosticRatings?.curiosity),
                specificity: toRating(ai.diagnosticRatings?.specificity),
                stakes: toRating(ai.diagnosticRatings?.stakes),
                visualPotential: toRating(ai.diagnosticRatings?.visualPotential),
                credibility: toRating(ai.diagnosticRatings?.credibility),
                storyPotential: toRating(ai.diagnosticRatings?.storyPotential),
                audienceRelevance: toRating(ai.diagnosticRatings?.audienceRelevance),
              };
              return {
                id: item.id || `psych-${idx + 1}-${Date.now()}`,
                num: item.num || idx + 1,
                factPremise: item.factPremise,
                angle: item.angle,
                code: item.code || "Q",
                pattern: item.pattern || "Curiosity Pattern",
                workingTitle: item.workingTitle,
                targetViewer: String(ai.targetViewer || NOT_RETURNED),
                clickMotivation: (["KNOW", "SEE", "UNDERSTAND", "EXPERIENCE"].includes(ai.clickMotivation)
                  ? ai.clickMotivation
                  : "UNDERSTAND") as ClickMotivationType,
                informationGap: String(ai.informationGap || NOT_RETURNED),
                stakes: String(ai.stakes || NOT_RETURNED),
                visualHook: String(ai.visualHook || NOT_RETURNED),
                titlePromise: String(ai.titlePromise || NOT_RETURNED),
                diagnosticRatings: ratings,
                diagnosticRatingsText: formatRatingsText(ratings),
              };
            });
          }
        }
      }
    } catch (err) {
      console.warn("OpenAI psychology analysis failed:", err);
    }
  }

  // 2. Gemini
  if (geminiKey) {
    for (const model of ["gemini-2.0-flash", "gemini-1.5-flash"]) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
        const res = await aiFetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.4,
            },
          }),
        });

        if (res.ok) {
          const json = (await res.json()) as any;
          const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            const list = Array.isArray(parsed) ? parsed : parsed.results || parsed.items || parsed.analyses || [];
            if (Array.isArray(list) && list.length > 0) {
              return items.map((item, idx) => {
                const ai = list[idx] || {};
                const ratings: DiagnosticRatings = {
                  interest: toRating(ai.diagnosticRatings?.interest),
                  curiosity: toRating(ai.diagnosticRatings?.curiosity),
                  specificity: toRating(ai.diagnosticRatings?.specificity),
                  stakes: toRating(ai.diagnosticRatings?.stakes),
                  visualPotential: toRating(ai.diagnosticRatings?.visualPotential),
                  credibility: toRating(ai.diagnosticRatings?.credibility),
                  storyPotential: toRating(ai.diagnosticRatings?.storyPotential),
                  audienceRelevance: toRating(ai.diagnosticRatings?.audienceRelevance),
                };
                return {
                  id: item.id || `psych-${idx + 1}-${Date.now()}`,
                  num: item.num || idx + 1,
                  factPremise: item.factPremise,
                  angle: item.angle,
                  code: item.code || "Q",
                  pattern: item.pattern || "Curiosity Pattern",
                  workingTitle: item.workingTitle,
                  targetViewer: String(ai.targetViewer || NOT_RETURNED),
                  clickMotivation: (["KNOW", "SEE", "UNDERSTAND", "EXPERIENCE"].includes(ai.clickMotivation)
                    ? ai.clickMotivation
                    : "UNDERSTAND") as ClickMotivationType,
                  informationGap: String(ai.informationGap || NOT_RETURNED),
                  stakes: String(ai.stakes || NOT_RETURNED),
                  visualHook: String(ai.visualHook || NOT_RETURNED),
                  titlePromise: String(ai.titlePromise || NOT_RETURNED),
                  diagnosticRatings: ratings,
                  diagnosticRatingsText: formatRatingsText(ratings),
                };
              });
            }
          }
        }
      } catch (err) {
        console.warn(`Gemini psychology analysis failed on ${model}:`, err);
      }
    }
  }

  // 3. Lovable AI Gateway
  if (lovableKey) {
    try {
      const res = await aiFetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": lovableKey,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const list = Array.isArray(parsed) ? parsed : parsed.results || parsed.items || parsed.analyses || [];
          if (Array.isArray(list) && list.length > 0) {
            return items.map((item, idx) => {
              const ai = list[idx] || {};
              const ratings: DiagnosticRatings = {
                interest: toRating(ai.diagnosticRatings?.interest),
                curiosity: toRating(ai.diagnosticRatings?.curiosity),
                specificity: toRating(ai.diagnosticRatings?.specificity),
                stakes: toRating(ai.diagnosticRatings?.stakes),
                visualPotential: toRating(ai.diagnosticRatings?.visualPotential),
                credibility: toRating(ai.diagnosticRatings?.credibility),
                storyPotential: toRating(ai.diagnosticRatings?.storyPotential),
                audienceRelevance: toRating(ai.diagnosticRatings?.audienceRelevance),
              };
              return {
                id: item.id || `psych-${idx + 1}-${Date.now()}`,
                num: item.num || idx + 1,
                factPremise: item.factPremise,
                angle: item.angle,
                code: item.code || "Q",
                pattern: item.pattern || "Curiosity Pattern",
                workingTitle: item.workingTitle,
                targetViewer: String(ai.targetViewer || NOT_RETURNED),
                clickMotivation: (["KNOW", "SEE", "UNDERSTAND", "EXPERIENCE"].includes(ai.clickMotivation)
                  ? ai.clickMotivation
                  : "UNDERSTAND") as ClickMotivationType,
                informationGap: String(ai.informationGap || NOT_RETURNED),
                stakes: String(ai.stakes || NOT_RETURNED),
                visualHook: String(ai.visualHook || NOT_RETURNED),
                titlePromise: String(ai.titlePromise || NOT_RETURNED),
                diagnosticRatings: ratings,
                diagnosticRatingsText: formatRatingsText(ratings),
              };
            });
          }
        }
      }
    } catch (err) {
      console.warn("Lovable gateway psychology analysis failed:", err);
    }
  }

  return null;
}

// Server function exposed to frontend
export const analyzePsychologyServer = createServerFn({ method: "POST" })
  .validator((d: unknown) => AnalyzePsychologyInput.parse(d))
  .handler(async ({ data }) => {
    const { items, aiApiKey } = data;

    const userAiKey = aiApiKey?.trim();
    const isOpenAi = userAiKey?.startsWith("sk-");
    const isGemini = userAiKey?.startsWith("AIza");

    const geminiKey =
      (isGemini ? userAiKey : undefined) ||
      process.env["GEMINI_API_KEY"] ||
      process.env["GOOGLE_API_KEY"] ||
      process.env["GOOGLE_AI_KEY"];

    const openAiKey =
      (isOpenAi ? userAiKey : undefined) ||
      process.env["OPENAI_API_KEY"];

    const lovableKey = process.env["LOVABLE_API_KEY"];

    // 1. Try AI batch analysis if keys available
    if (geminiKey || openAiKey || lovableKey) {
      const aiResults = await analyzePsychologyAiBatch(
        items,
        geminiKey,
        openAiKey,
        lovableKey,
      );
      if (aiResults && aiResults.length > 0) {
        return {
          results: aiResults,
          mode: "ai" as const,
        };
      }
    }

    // 2. No AI available: return the items unrated rather than inventing scores.
    return {
      results: analyzePsychologyUnrated(items),
      mode: "unrated" as const,
    };
  });
