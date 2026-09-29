/**
 * Grounded fact verification.
 *
 * The previous implementation asked an LLM to invent citations from memory
 * ("Author — Title — Year — Publisher") with no retrieval step at all, and
 * a no-key fallback that returned the *same* hardcoded Egyptology citations
 * regardless of the claim. Both could produce confident-looking fake
 * sources. This module replaces that with a real two-step, search-grounded
 * pipeline:
 *
 *   1. RESEARCH — call the provider with live web search enabled (Gemini's
 *      `google_search` tool, or OpenAI's search-enabled model) and capture
 *      the actual source URLs it grounded on.
 *   2. STRUCTURE — ask the model to fill the app's JSON schema using ONLY
 *      the sources returned in step 1, then verify server-side that every
 *      "source" the model wrote back actually matches a URL from step 1.
 *      Any record whose source can't be matched to a real grounding result
 *      is downgraded to NEEDS RESEARCH / LOW confidence rather than trusted.
 *
 * This is genuinely dependent on the provider's current search-grounding
 * API surface, which changes over time. If a request shape below starts
 * failing, check the provider's current docs for the grounding tool name
 * and update GEMINI_MODEL / OPENAI_SEARCH_MODEL accordingly — that's why
 * both are env-overridable rather than buried in code.
 */

import { fetchWithTimeout } from "./server-config";
import {
  CLAIM_TYPE_OPTIONS,
  CLAIM_STATUS_OPTIONS,
  CLAIM_CONFIDENCE_OPTIONS,
  SOURCE_TIER_OPTIONS,
  type FactVerificationRecord,
  type ClaimType,
  type ClaimStatus,
  type ClaimConfidence,
  type SourceTier,
} from "./fact-types";

export type GroundingSource = { title: string; url: string };

export type ClaimInput = {
  claim: string;
  claimType?: string | undefined;
  importance?: string | undefined;
  storyBeat?: string | undefined;
};

const GEMINI_MODEL = process.env["GEMINI_MODEL"]?.trim() || "gemini-2.0-flash";
const OPENAI_SEARCH_MODEL = process.env["OPENAI_SEARCH_MODEL"]?.trim() || "gpt-4o-mini-search-preview";
const OPENAI_STRUCTURE_MODEL = process.env["OPENAI_MODEL"]?.trim() || "gpt-4o-mini";

function buildResearchPrompt(storyTitle: string, coreQuestion: string | undefined, claims: ClaimInput[]): string {
  const claimsList = claims.map((c, i) => `${i + 1}. ${c.claim}`).join("\n");
  return `You are a documentary fact-checker. Research each claim below using web search and report, for each one:
- Whether it is well-supported, disputed, or unverifiable
- The strongest specific source(s) you found (real, named sources only — never a vague category like "scholarly publications")
- A short note on how strong the evidence is

DOCUMENTARY: "${storyTitle}"${coreQuestion ? `\nCore question: "${coreQuestion}"` : ""}

CLAIMS:
${claimsList}

Be skeptical: clearly separate claims backed by direct historical/archaeological/scientific evidence from claims that are only plausible interpretations or single-experiment results. Cite your sources as you go.`;
}

function buildStructurePrompt(
  storyTitle: string,
  claims: ClaimInput[],
  researchNotes: string,
  sources: GroundingSource[],
): string {
  const claimsList = claims.map((c, i) => `${i + 1}. [Beat: ${c.storyBeat || "N/A"}] ${c.claim}`).join("\n");
  const sourcesList =
    sources.length > 0
      ? sources.map((s, i) => `[${i + 1}] ${s.title} — ${s.url}`).join("\n")
      : "(no sources were found by web search)";

  return `Using ONLY the research notes and numbered source list below — do not invent any source that isn't in the list — convert this into a structured fact-verification dossier for "${storyTitle}".

CLAIMS:
${claimsList}

RESEARCH NOTES:
${researchNotes || "(no research notes were returned)"}

SOURCES FOUND BY WEB SEARCH:
${sourcesList}

RULES:
- For each claim, set "source" to the exact "Title — URL" of the numbered source you relied on. If none of the sources actually support the claim, set "source" to "No reliable source found" and "status" to "NEEDS RESEARCH".
- Never write a generic category as a source (e.g. "scholarly publications", "archival documentation").
- Distinguish claims with direct evidence (status VERIFIED, but only when a real source directly supports it) from claims that are plausible interpretations or single-experiment results (status PARTIALLY VERIFIED or NEEDS RESEARCH, confidence MEDIUM or LOW).
- Never mark something VERIFIED/HIGH confidence unless a specific source from the list directly supports it.

Return ONLY a valid JSON object of this exact shape, one entry per claim, in order:
{
  "records": [
    {
      "claim": "exact claim text",
      "claimType": "Historical fact" | "Archaeological evidence" | "Scientific fact" | "Interpretation" | "Experimental reconstruction" | "Quantitative claim" | "Attribution",
      "importance": "HIGH" | "MEDIUM" | "LOW",
      "source": "Title — URL, or 'No reliable source found'",
      "evidence": "what the source(s) actually say that bears on this claim",
      "status": "VERIFIED" | "PARTIALLY VERIFIED" | "DISPUTED" | "NEEDS RESEARCH" | "EXCLUDE",
      "confidence": "HIGH" | "MEDIUM" | "LOW",
      "notes": "caveats, e.g. distinguishing feasibility from proof",
      "sourceTier": "Tier 1: Primary / Institutional" | "Tier 2: Academic / Scholarly" | "Tier 3: Reputable Secondary" | "Tier 4: General Internet" | "Tier 5: Social / Popular Media"
    }
  ]
}`;
}

function safeParseJson(raw: string): any {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
}

/**
 * Cross-check every model-written "source" against the real grounding
 * sources. If it doesn't match any of them, the model likely fabricated or
 * mis-cited it — downgrade rather than trust it.
 */
export function verifyAgainstGroundingSources(
  records: FactVerificationRecord[],
  sources: GroundingSource[],
): FactVerificationRecord[] {
  return records.map((rec) => {
    if (rec.source === "No reliable source found" || sources.length === 0) {
      return rec;
    }
    const matched = sources.some(
      (s) => rec.source.includes(s.url) || (s.title && rec.source.includes(s.title)),
    );
    if (!matched && (rec.status === "VERIFIED" || rec.status === "PARTIALLY VERIFIED")) {
      return {
        ...rec,
        status: "NEEDS RESEARCH" as ClaimStatus,
        confidence: "LOW" as ClaimConfidence,
        notes: `${rec.notes ? rec.notes + " " : ""}(Downgraded automatically: cited source could not be matched to a live web-search result.)`,
      };
    }
    return rec;
  });
}

function toRecords(
  parsedRecords: any[],
  claims: ClaimInput[],
  sources: GroundingSource[],
): FactVerificationRecord[] {
  const records: FactVerificationRecord[] = parsedRecords.map((r, idx) => ({
    num: idx + 1,
    claim: String(r.claim || claims[idx]?.claim || ""),
    claimType: (CLAIM_TYPE_OPTIONS as string[]).includes(r.claimType) ? (r.claimType as ClaimType) : "Interpretation",
    importance: (["HIGH", "MEDIUM", "LOW"] as string[]).includes(r.importance) ? r.importance : "MEDIUM",
    source: String(r.source || "No reliable source found"),
    evidence: String(r.evidence || "No supporting evidence returned by research."),
    status: (CLAIM_STATUS_OPTIONS as string[]).includes(r.status) ? (r.status as ClaimStatus) : "NEEDS RESEARCH",
    confidence: (CLAIM_CONFIDENCE_OPTIONS as string[]).includes(r.confidence)
      ? (r.confidence as ClaimConfidence)
      : "LOW",
    notes: String(r.notes || ""),
    sourceTier: (SOURCE_TIER_OPTIONS as string[]).includes(r.sourceTier)
      ? (r.sourceTier as SourceTier)
      : "Tier 4: General Internet",
    storyBeat: claims[idx]?.storyBeat || "General Investigation",
  }));
  return verifyAgainstGroundingSources(records, sources);
}

async function researchWithGemini(
  apiKey: string,
  storyTitle: string,
  coreQuestion: string | undefined,
  claims: ClaimInput[],
): Promise<{ records: FactVerificationRecord[]; sources: GroundingSource[] }> {
  // Step 1: real web search grounding.
  const researchRes = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildResearchPrompt(storyTitle, coreQuestion, claims) }] }],
        tools: [{ google_search: {} }],
        generationConfig: { temperature: 0.2 },
      }),
    },
    25_000,
  );
  if (!researchRes.ok) {
    throw new Error(`Gemini research call failed: ${researchRes.status} ${await researchRes.text().catch(() => "")}`);
  }
  const researchJson = await researchRes.json();
  const candidate = researchJson.candidates?.[0];
  const researchNotes: string = (candidate?.content?.parts || []).map((p: any) => p.text || "").join("\n");
  const groundingChunks: any[] = candidate?.groundingMetadata?.groundingChunks || [];
  const sources: GroundingSource[] = groundingChunks
    .map((c) => ({ title: c.web?.title || c.web?.uri || "Untitled source", url: c.web?.uri }))
    .filter((s): s is GroundingSource => Boolean(s.url));

  // Step 2: structure the findings into the app's schema, constrained to
  // the sources actually found above.
  const structureRes = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildStructurePrompt(storyTitle, claims, researchNotes, sources) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
      }),
    },
    25_000,
  );
  if (!structureRes.ok) {
    throw new Error(`Gemini structuring call failed: ${structureRes.status}`);
  }
  const structureJson = await structureRes.json();
  const rawContent: string = structureJson.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const parsed = safeParseJson(rawContent);
  return { records: toRecords(parsed.records || [], claims, sources), sources };
}

async function researchWithOpenAi(
  apiKey: string,
  storyTitle: string,
  coreQuestion: string | undefined,
  claims: ClaimInput[],
): Promise<{ records: FactVerificationRecord[]; sources: GroundingSource[] }> {
  // Step 1: real web search grounding via a search-enabled chat model.
  const researchRes = await fetchWithTimeout(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: OPENAI_SEARCH_MODEL,
        messages: [{ role: "user", content: buildResearchPrompt(storyTitle, coreQuestion, claims) }],
      }),
    },
    25_000,
  );
  if (!researchRes.ok) {
    throw new Error(`OpenAI research call failed: ${researchRes.status} ${await researchRes.text().catch(() => "")}`);
  }
  const researchJson = await researchRes.json();
  const message = researchJson.choices?.[0]?.message;
  const researchNotes: string = message?.content || "";
  const annotations: any[] = message?.annotations || [];
  const sources: GroundingSource[] = annotations
    .filter((a) => a.type === "url_citation" && a.url_citation?.url)
    .map((a) => ({ title: a.url_citation.title || a.url_citation.url, url: a.url_citation.url }));

  // Step 2: structure the findings, constrained to the sources found above.
  const structureRes = await fetchWithTimeout(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: OPENAI_STRUCTURE_MODEL,
        messages: [{ role: "user", content: buildStructurePrompt(storyTitle, claims, researchNotes, sources) }],
        response_format: { type: "json_object" },
        temperature: 0.1,
      }),
    },
    25_000,
  );
  if (!structureRes.ok) {
    throw new Error(`OpenAI structuring call failed: ${structureRes.status}`);
  }
  const structureJson = await structureRes.json();
  const rawContent: string = structureJson.choices?.[0]?.message?.content || "{}";
  const parsed = safeParseJson(rawContent);
  return { records: toRecords(parsed.records || [], claims, sources), sources };
}

export async function researchAndVerifyClaims(
  provider: "gemini" | "openai",
  apiKey: string,
  storyTitle: string,
  coreQuestion: string | undefined,
  claims: ClaimInput[],
): Promise<{ records: FactVerificationRecord[]; sources: GroundingSource[] }> {
  return provider === "gemini"
    ? researchWithGemini(apiKey, storyTitle, coreQuestion, claims)
    : researchWithOpenAi(apiKey, storyTitle, coreQuestion, claims);
}
