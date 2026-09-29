import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolveAiKey, detectAiProvider } from "./server-config";
import { researchAndVerifyClaims, type ClaimInput } from "./fact-grounding.server";

export * from "./fact-types";
import {
  type ClaimType,
  type ClaimImportance,
  type FactVerificationRecord,
  type FactVerificationDossier,
  calculateDossierStats,
} from "./fact-types";

// ============================================================================
// UNVERIFIED FALLBACK (used only when no AI key is configured, or the
// grounded research call fails)
// ============================================================================
//
// This intentionally never invents a citation, a source, or an evidence
// string. Earlier versions of this function returned confident-looking but
// fabricated academic citations for every claim, which is worse than no
// answer at all in a fact-checking tool. If verification can't be done for
// real, the honest answer is "needs research" — not a plausible-sounding
// guess.

export function generateUnverifiedFallback(input: {
  storyTitle: string;
  coreQuestion?: string | undefined;
  claims: {
    claim: string;
    claimType?: string | undefined;
    importance?: string | undefined;
    storyBeat?: string | undefined;
  }[];
  reason?: string;
}): FactVerificationDossier {
  const reason =
    input.reason ||
    "No AI key with web search is configured. Add a Gemini or OpenAI key in API Settings to enable grounded fact verification.";

  const records: FactVerificationRecord[] = input.claims.map((c, index) => ({
    num: index + 1,
    claim: c.claim.trim(),
    claimType: (c.claimType as ClaimType) || "Interpretation",
    importance: (c.importance as ClaimImportance) || "MEDIUM",
    source: "No reliable source found",
    evidence: "Not yet researched.",
    status: "NEEDS RESEARCH",
    confidence: "LOW",
    notes: reason,
    sourceTier: "Tier 4: General Internet",
    evidenceCategory: "Unverified Claim",
    independentSourcesCount: 0,
    storyBeat: c.storyBeat || "General Investigation",
  }));

  return {
    id: `unverified-${Date.now()}`,
    storyTitle: input.storyTitle,
    ...(input.coreQuestion ? { coreQuestion: input.coreQuestion } : {}),
    records,
    summaryStats: calculateDossierStats(records),
  };
}

const VerifyClaimsInput = z.object({
  storyTitle: z.string().trim().min(1),
  coreQuestion: z.string().trim().optional(),
  claims: z.array(
    z.object({
      claim: z.string().trim().min(1),
      claimType: z.string().optional(),
      importance: z.string().optional(),
      storyBeat: z.string().optional(),
    })
  ).min(1),
  aiApiKey: z.string().trim().optional(),
});

export const verifyClaimsServer = createServerFn({ method: "POST" })
  .validator((d: unknown) => VerifyClaimsInput.parse(d))
  .handler(async ({ data }): Promise<FactVerificationDossier> => {
    const effectiveAiKey = resolveAiKey(data.aiApiKey);

    if (!effectiveAiKey) {
      return generateUnverifiedFallback(data);
    }

    try {
      const provider = detectAiProvider(effectiveAiKey);
      const { records } = await researchAndVerifyClaims(
        provider,
        effectiveAiKey,
        data.storyTitle,
        data.coreQuestion,
        data.claims,
      );

      return {
        id: `fact-verification-${Date.now()}`,
        storyTitle: data.storyTitle,
        ...(data.coreQuestion ? { coreQuestion: data.coreQuestion } : {}),
        records,
        summaryStats: calculateDossierStats(records),
      };
    } catch (err) {
      console.error("Grounded fact verification failed:", err);
      return generateUnverifiedFallback({
        ...data,
        reason:
          "Automated verification failed for this batch (the search-grounded research call errored). Try again, or verify these claims manually.",
      });
    }
  });
