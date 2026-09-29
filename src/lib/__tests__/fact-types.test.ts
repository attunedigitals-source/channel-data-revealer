import { describe, it, expect } from "vitest";
import { calculateDossierStats, type FactVerificationRecord } from "../fact-types";

function makeRecord(overrides: Partial<FactVerificationRecord>): FactVerificationRecord {
  return {
    num: 1,
    claim: "Example claim",
    claimType: "Interpretation",
    importance: "MEDIUM",
    source: "No reliable source found",
    evidence: "",
    status: "NEEDS RESEARCH",
    confidence: "LOW",
    notes: "",
    sourceTier: "Tier 4: General Internet",
    storyBeat: "General Investigation",
    ...overrides,
  };
}

describe("calculateDossierStats", () => {
  it("counts records by status and confidence", () => {
    const records = [
      makeRecord({ status: "VERIFIED", confidence: "HIGH" }),
      makeRecord({ status: "VERIFIED", confidence: "HIGH" }),
      makeRecord({ status: "NEEDS RESEARCH", confidence: "LOW" }),
      makeRecord({ status: "DISPUTED", confidence: "MEDIUM" }),
    ];

    const stats = calculateDossierStats(records);

    expect(stats.total).toBe(4);
    expect(stats.verified).toBe(2);
    expect(stats.needsResearch).toBe(1);
    expect(stats.disputed).toBe(1);
    expect(stats.lowConfidence).toBe(1);
  });

  it("handles an empty claim list without dividing by zero", () => {
    const stats = calculateDossierStats([]);
    expect(stats.total).toBe(0);
    expect(stats.verified).toBe(0);
  });
});
