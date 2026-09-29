// Shared fact-verification types and constants.
// Kept separate from factverification.functions.ts (server functions) and
// fact-grounding.server.ts (grounded research) so neither has to import the
// other, which would create a circular module dependency.


export type ClaimType =
  | "Historical fact"
  | "Archaeological evidence"
  | "Scientific fact"
  | "Interpretation"
  | "Experimental reconstruction"
  | "Quantitative claim"
  | "Attribution";

export type ClaimStatus =
  | "VERIFIED"
  | "PARTIALLY VERIFIED"
  | "DISPUTED"
  | "NEEDS RESEARCH"
  | "EXCLUDE";

export type ClaimConfidence = "HIGH" | "MEDIUM" | "LOW";

export type ClaimImportance = "HIGH" | "MEDIUM" | "LOW";

export type SourceTier =
  | "Tier 1: Primary / Institutional"
  | "Tier 2: Academic / Scholarly"
  | "Tier 3: Reputable Secondary"
  | "Tier 4: General Internet"
  | "Tier 5: Social / Popular Media";

export type EvidenceCategory =
  | "Established Evidence"
  | "Strongly Supported Interpretation"
  | "Disputed Interpretation"
  | "Experimental Reconstruction"
  | "Unverified Claim"
  | "Claim to Exclude";

export interface FactVerificationRecord {
  num: number;
  claim: string;
  claimType: ClaimType;
  importance: ClaimImportance;
  source: string;
  evidence: string;
  status: ClaimStatus;
  confidence: ClaimConfidence;
  notes: string;
  sourceTier?: SourceTier;
  suggestedNarration?: string;
  evidenceCategory?: EvidenceCategory;
  independentSourcesCount?: number;
  storyBeat?: string;
}

export interface FactVerificationDossier {
  id: string;
  storyTitle: string;
  coreQuestion?: string;
  records: FactVerificationRecord[];
  summaryStats: {
    total: number;
    verified: number;
    partiallyVerified: number;
    disputed: number;
    needsResearch: number;
    excluded: number;
    highConfidence: number;
    mediumConfidence: number;
    lowConfidence: number;
  };
}

export const CLAIM_TYPE_OPTIONS: ClaimType[] = [
  "Historical fact",
  "Archaeological evidence",
  "Scientific fact",
  "Interpretation",
  "Experimental reconstruction",
  "Quantitative claim",
  "Attribution",
];

export const CLAIM_STATUS_OPTIONS: ClaimStatus[] = [
  "VERIFIED",
  "PARTIALLY VERIFIED",
  "DISPUTED",
  "NEEDS RESEARCH",
  "EXCLUDE",
];

export const CLAIM_CONFIDENCE_OPTIONS: ClaimConfidence[] = ["HIGH", "MEDIUM", "LOW"];

export const CLAIM_IMPORTANCE_OPTIONS: ClaimImportance[] = ["HIGH", "MEDIUM", "LOW"];

export const SOURCE_TIER_OPTIONS: SourceTier[] = [
  "Tier 1: Primary / Institutional",
  "Tier 2: Academic / Scholarly",
  "Tier 3: Reputable Secondary",
  "Tier 4: General Internet",
  "Tier 5: Social / Popular Media",
];

// Helper to compute summary stats for any list of records
export function calculateDossierStats(records: FactVerificationRecord[]) {
  return {
    total: records.length,
    verified: records.filter((r) => r.status === "VERIFIED").length,
    partiallyVerified: records.filter((r) => r.status === "PARTIALLY VERIFIED").length,
    disputed: records.filter((r) => r.status === "DISPUTED").length,
    needsResearch: records.filter((r) => r.status === "NEEDS RESEARCH").length,
    excluded: records.filter((r) => r.status === "EXCLUDE").length,
    highConfidence: records.filter((r) => r.confidence === "HIGH").length,
    mediumConfidence: records.filter((r) => r.confidence === "MEDIUM").length,
    lowConfidence: records.filter((r) => r.confidence === "LOW").length,
  };
}
