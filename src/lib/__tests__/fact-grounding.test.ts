import { describe, it, expect } from "vitest";
import { verifyAgainstGroundingSources, type GroundingSource } from "../fact-grounding.server";
import type { FactVerificationRecord } from "../fact-types";

function makeRecord(overrides: Partial<FactVerificationRecord>): FactVerificationRecord {
  return {
    num: 1,
    claim: "Example claim",
    claimType: "Interpretation",
    importance: "MEDIUM",
    source: "No reliable source found",
    evidence: "",
    status: "VERIFIED",
    confidence: "HIGH",
    notes: "",
    sourceTier: "Tier 4: General Internet",
    storyBeat: "General Investigation",
    ...overrides,
  };
}

describe("verifyAgainstGroundingSources", () => {
  const realSources: GroundingSource[] = [{ title: "NASA Report", url: "https://nasa.gov/report" }];

  it("leaves a record alone when its source matches a real grounding result", () => {
    const records = [makeRecord({ source: "NASA Report — https://nasa.gov/report" })];
    const result = verifyAgainstGroundingSources(records, realSources);
    expect(result[0]!.status).toBe("VERIFIED");
    expect(result[0]!.confidence).toBe("HIGH");
  });

  it("downgrades a VERIFIED record whose source cannot be matched to a real result", () => {
    const records = [makeRecord({ source: "Some Book — https://example.com/invented", status: "VERIFIED" })];
    const result = verifyAgainstGroundingSources(records, realSources);
    expect(result[0]!.status).toBe("NEEDS RESEARCH");
    expect(result[0]!.confidence).toBe("LOW");
    expect(result[0]!.notes).toContain("could not be matched");
  });

  it("does not touch a record that already says no source was found", () => {
    const records = [makeRecord({ source: "No reliable source found", status: "NEEDS RESEARCH" })];
    const result = verifyAgainstGroundingSources(records, realSources);
    expect(result[0]!.notes).toBe("");
  });

  it("does not downgrade when there were no grounding sources to check against at all", () => {
    const records = [makeRecord({ source: "Anything", status: "VERIFIED" })];
    const result = verifyAgainstGroundingSources(records, []);
    expect(result[0]!.status).toBe("VERIFIED");
  });
});
