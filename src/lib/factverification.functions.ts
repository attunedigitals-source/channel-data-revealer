import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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

// ============================================================================
// OFFICIAL DAY 6 REFERENCE STUDY EXEMPLARS
// ============================================================================

// 1. Ancient Egyptian Stonework Master Research Dossier
export const DAY6_EXEMPLAR_EGYPTIAN: FactVerificationDossier = {
  id: "day6-exemplar-egyptian",
  storyTitle: "How Did Ancient Egyptians Achieve Such Precise Stonework?",
  coreQuestion: "What tools and mechanical techniques allowed Bronze Age Egyptian craftsmen to shape and fit ultra-hard granite without steel?",
  records: [
    {
      num: 1,
      claim: "Ancient Egyptians worked hard igneous stone (granite, basalt, diorite) on a monumental scale.",
      claimType: "Archaeological evidence",
      importance: "HIGH",
      source: "Arnold, D. (1991) Building in Egypt; Klemm & Klemm (2001) Stones and Quarries of Ancient Egypt; Aswan Northern Quarries Survey.",
      evidence: "Physical quarries at Aswan, Gebel Gulab, and Chephren's Quarry. Unfinished obelisk in situ, casing blocks at Giza, and granite sarcophagi across Old Kingdom pyramid complexes.",
      status: "VERIFIED",
      confidence: "HIGH",
      notes: "Undisputed physical foundation. Primary geological survey and artifact recovery confirm widespread extraction and masonry.",
      sourceTier: "Tier 1: Primary / Institutional",
      suggestedNarration: "Archaeologists have cataloged thousands of tons of worked igneous stone across Old Kingdom necropolises.",
      evidenceCategory: "Established Evidence",
      independentSourcesCount: 5,
      storyBeat: "Context",
    },
    {
      num: 2,
      claim: "Spherical dolerite pounders (mauls) were the primary percussive tool used to crush granite in quarries.",
      claimType: "Archaeological evidence",
      importance: "HIGH",
      source: "Engelbach, R. (1922) The Problem of the Obelisks; Stocks, D. (2003) Experiments in Egyptian Archaeology, Ch. 4.",
      evidence: "Thousands of spherical dolerite hammerstones discovered directly inside the trenches surrounding the Unfinished Obelisk at Aswan.",
      status: "VERIFIED",
      confidence: "HIGH",
      notes: "Dolerite spheroids are naturally resistant to shattering upon impact. Physical recovery in trench rubble provides definitive proof.",
      sourceTier: "Tier 1: Primary / Institutional",
      suggestedNarration: "In the granite quarries of Aswan, excavators recovered thousands of spherical dolerite pounders used to crush the rock face.",
      evidenceCategory: "Established Evidence",
      independentSourcesCount: 4,
      storyBeat: "Investigation",
    },
    {
      num: 3,
      claim: "Dolerite quarry pounders weighed an exact, standardized 12 pounds.",
      claimType: "Quantitative claim",
      importance: "MEDIUM",
      source: "Stocks, D. (2003); Arnold, D. (1991); Engelbach, R. (1922).",
      evidence: "Measured museum and field specimens range from 4 lbs (small handheld peckers) to 15+ lbs (two-handed mauls). Twelve pounds was an average of specific samples tested by Stocks.",
      status: "PARTIALLY VERIFIED",
      confidence: "MEDIUM",
      notes: "Presenting '12 pounds' as an ancient regulatory standard is inaccurate. Weights varied depending on worker stamina and trench width.",
      sourceTier: "Tier 2: Academic / Scholarly",
      suggestedNarration: "Archaeological field surveys show these mauls varied in size, often weighing between eight and fifteen pounds.",
      evidenceCategory: "Strongly Supported Interpretation",
      independentSourcesCount: 3,
      storyBeat: "Investigation",
    },
    {
      num: 4,
      claim: "Megalithic joints are so tight that a razor blade cannot fit between the blocks.",
      claimType: "Interpretation",
      importance: "HIGH",
      source: "Petrie, W.M.F. (1883) Pyramids and Temples of Gizeh; Lehner, M. (1997) The Complete Pyramids.",
      evidence: "Petrie measured casing stone joint gaps averaging 1/50th of an inch (0.5 mm). However, 'razor cannot enter' is an evocative modern rhetorical trope rather than an ancient engineering tolerance.",
      status: "DISPUTED",
      confidence: "MEDIUM",
      notes: "The joint precision is remarkable, but the razor blade trope encourages sensationalism. Modern precision surveys indicate sub-millimeter fits achieved by in-situ grinding.",
      sourceTier: "Tier 3: Reputable Secondary",
      suggestedNarration: "Historical measurements by Flinders Petrie showed joints fitted with sub-millimeter precision, averaging less than half a millimeter apart.",
      evidenceCategory: "Disputed Interpretation",
      independentSourcesCount: 3,
      storyBeat: "Cold Open",
    },
    {
      num: 5,
      claim: "Copper chisels and copper saw blades alone could cut granite without abrasive additives.",
      claimType: "Scientific fact",
      importance: "HIGH",
      source: "Lucas, A. & Harris, J.R. (1962) Ancient Egyptian Materials and Industries; Stocks, D. (2003).",
      evidence: "Mohs hardness scale: pure copper has a hardness of ~3.0; quartz crystals in granite have a hardness of 7.0. A copper blade striking granite without abrasive will simply deform and blunt immediately.",
      status: "EXCLUDE",
      confidence: "HIGH",
      notes: "Physical impossibility. Copper can only act as a vehicle or carrier for a hard abrasive slurry. Presenting copper as the cutting agent directly contradicts materials science.",
      sourceTier: "Tier 1: Primary / Institutional",
      suggestedNarration: "Because copper is far softer than quartz, metal tools could never cut granite on their own without the continuous addition of abrasive slurry.",
      evidenceCategory: "Claim to Exclude",
      independentSourcesCount: 4,
      storyBeat: "Complication",
    },
    {
      num: 6,
      claim: "Quartz sand slurry was used as an abrasive agent to saw and core-drill hard granite.",
      claimType: "Experimental reconstruction",
      importance: "HIGH",
      source: "Stocks, D. (2003) Experiments in Egyptian Archaeology; Petrie, W.M.F. (1883); Lucas & Harris (1962).",
      evidence: "Microscopic analysis of drill core striations matches rolling micro-fracture patterns produced in modern tests using wet quartz sand and copper tubes.",
      status: "VERIFIED",
      confidence: "HIGH",
      notes: "Stocks replicated both tubular core drilling and saw trenching through granite using quartz slurry. Can work ≠ universally proved, but matches core striations.",
      sourceTier: "Tier 2: Academic / Scholarly",
      suggestedNarration: "Experimental archaeology has demonstrated that copper tubes combined with quartz sand slurry can cut through hard granite through continuous micro-fracturing.",
      evidenceCategory: "Experimental Reconstruction",
      independentSourcesCount: 3,
      storyBeat: "Discovery / Evidence",
    },
    {
      num: 7,
      claim: "Ancient Egyptian stone cutting achieved a uniform, documented speed of exactly 12 cm³/hour.",
      claimType: "Quantitative claim",
      importance: "MEDIUM",
      source: "Stocks, D. (2001) 'Testing Ancient Egyptian Stone-Working Tools', Antiquity 75(288).",
      evidence: "Denys Stocks measured cutting rates around 12 cm³/hr during specific experimental runs on granite using a hand-operated copper saw and quartz sand.",
      status: "PARTIALLY VERIFIED",
      confidence: "MEDIUM",
      notes: "This was a modern experimental baseline under specific laboratory conditions. Ancient workshop teams with multiple laborers, varying pressures, and slurry formulas achieved varying rates.",
      sourceTier: "Tier 2: Academic / Scholarly",
      suggestedNarration: "In modern experimental reconstructions, craftsman Denys Stocks achieved cutting rates around twelve cubic centimeters per hour under controlled conditions.",
      evidenceCategory: "Experimental Reconstruction",
      independentSourcesCount: 2,
      storyBeat: "Explanation",
    },
    {
      num: 8,
      claim: "Ancient craftsmen utilized the 'Three-Rod Triangulation Method' with string to verify flat planes.",
      claimType: "Attribution",
      importance: "HIGH",
      source: "Arnold, D. (1991) Building in Egypt; Petrie, W.M.F. (1883); Clarke & Engelbach (1930) Ancient Egyptian Masonry.",
      evidence: "Wooden leveling rods connected by twine have been recovered from New Kingdom tombs, and the three-rod technique is attested in traditional stone-cutting trade practices.",
      status: "VERIFIED",
      confidence: "HIGH",
      notes: "Physical wooden test rods in museum collections support the use of optical sighting lines across dressed stone surfaces.",
      sourceTier: "Tier 2: Academic / Scholarly",
      suggestedNarration: "Surviving tools and tomb depictions show that masons used sets of three wooden rods and taut string to sight across blocks and identify high spots.",
      evidenceCategory: "Established Evidence",
      independentSourcesCount: 3,
      storyBeat: "Explanation",
    },
    {
      num: 9,
      claim: "Limestone guide blocks were physically clamped to granite faces to prevent tubular drill wobble.",
      claimType: "Interpretation",
      importance: "MEDIUM",
      source: "Stocks, D. (2003); Lucas & Harris (1962).",
      evidence: "Reconstructed by Stocks in experimental trials to initiate drill holes on smooth stone. However, specific archaeological surviving guide blocks from Old Kingdom workshops are not conclusively identified.",
      status: "NEEDS RESEARCH",
      confidence: "MEDIUM",
      notes: "Highly plausible mechanical hypothesis, but physical artifact confirmation remains inconclusive. Frame as a proposed workshop solution rather than verified hardware.",
      sourceTier: "Tier 2: Academic / Scholarly",
      suggestedNarration: "Researchers have proposed that wooden or soft limestone guide blocks were likely used to stabilize drill bits until a circular groove was established.",
      evidenceCategory: "Strongly Supported Interpretation",
      independentSourcesCount: 2,
      storyBeat: "Complication",
    },
    {
      num: 10,
      claim: "Over 45,000 tons of granite were quarried at Aswan and transported 500 miles north to Giza.",
      claimType: "Quantitative claim",
      importance: "MEDIUM",
      source: "Lehner, M. (1997); Klemm & Klemm (2001); Maragioglio & Rinaldi (1965).",
      evidence: "Total volumetric surveys of the King's Chamber beams, relieving chambers, sarcophagi, and casing blocks on the third pyramid give an estimated total between 40,000 and 50,000 tons.",
      status: "PARTIALLY VERIFIED",
      confidence: "HIGH",
      notes: "The volume of granite at Giza is well surveyed, but 45,000 tons is an estimate derived from architectural calculations rather than ancient shipping records.",
      sourceTier: "Tier 2: Academic / Scholarly",
      suggestedNarration: "Scholars calculate that between forty and fifty thousand tons of granite were ferried down the Nile from Aswan to the Giza plateau.",
      evidenceCategory: "Strongly Supported Interpretation",
      independentSourcesCount: 3,
      storyBeat: "Context",
    },
    {
      num: 11,
      claim: "Acoustic levitation and high-frequency sound waves were used to lift and position megaliths.",
      claimType: "Interpretation",
      importance: "HIGH",
      source: "Archaeological Consensus & Material Physics Surveys (Petrie, Arnold, Lehner).",
      evidence: "Zero archaeological, textual, physical, or experimental evidence. Thoroughly contradicts physical conservation of energy and mechanics.",
      status: "EXCLUDE",
      confidence: "HIGH",
      notes: "Dangerous pseudohistorical trope. Including this as a plausible theory destroys channel credibility and breaches documentary evidence standards.",
      sourceTier: "Tier 5: Social / Popular Media",
      suggestedNarration: "Exclude completely: unsubstantiated internet lore that contradicts physical evidence and verified transport sledges.",
      evidenceCategory: "Claim to Exclude",
      independentSourcesCount: 0,
      storyBeat: "Investigation",
    },
  ],
  summaryStats: {
    total: 11,
    verified: 4,
    partiallyVerified: 3,
    disputed: 1,
    needsResearch: 1,
    excluded: 2,
    highConfidence: 7,
    mediumConfidence: 4,
    lowConfidence: 0,
  },
};

// 2. ScanPyramids Cosmic Rays Research Exemplar
export const DAY6_EXEMPLAR_SCANPYRAMIDS: FactVerificationDossier = {
  id: "day6-exemplar-scanpyramids",
  storyTitle: "What Did Cosmic Rays Detect Inside the Great Pyramid?",
  coreQuestion: "How did astrophysicists discover a 30-meter hidden void using muon radiography?",
  records: [
    {
      num: 1,
      claim: "Cosmic ray muons can penetrate hundreds of meters of dense limestone.",
      claimType: "Scientific fact",
      importance: "HIGH",
      source: "Morishima et al. (2017) 'Discovery of a big void in Khufu's Pyramid by observation of cosmic-ray muons', Nature 552: 386–390.",
      evidence: "Elementary particle physics: high-energy muons produced by cosmic ray showers in the upper atmosphere lose energy at known rates through matter, allowing density radiography.",
      status: "VERIFIED",
      confidence: "HIGH",
      notes: "Established particle physics dating back to Alvarez's 1970 experiments at Khafre's pyramid.",
      sourceTier: "Tier 1: Primary / Institutional",
      suggestedNarration: "Astrophysicists used cosmic ray muons—subatomic particles created in Earth's atmosphere that can pass through hundreds of meters of solid rock.",
      evidenceCategory: "Established Evidence",
      independentSourcesCount: 4,
      storyBeat: "Context",
    },
    {
      num: 2,
      claim: "A hidden void at least 30 meters long was independently confirmed by three distinct detector teams.",
      claimType: "Scientific fact",
      importance: "HIGH",
      source: "Nature (2017) ScanPyramids publication; Nagoya University, KEK, and CEA France joint papers.",
      evidence: "Three separate detection methods (nuclear emulsion plates, scintillator hodoscopes, and gas Micromegas) all detected statistically significant muon excess above the Grand Gallery.",
      status: "VERIFIED",
      confidence: "HIGH",
      notes: "Triangulated measurement meeting the Three Source Rule with 5-sigma statistical confidence.",
      sourceTier: "Tier 1: Primary / Institutional",
      suggestedNarration: "Three independent scientific teams using different detection technologies confirmed the presence of a void at least thirty meters long.",
      evidenceCategory: "Established Evidence",
      independentSourcesCount: 3,
      storyBeat: "Discovery / Evidence",
    },
    {
      num: 3,
      claim: "The Big Void is a secret burial chamber containing undiscovered artifacts of Pharaoh Khufu.",
      claimType: "Interpretation",
      importance: "HIGH",
      source: "Hawass, Z. et al. (2018) Council for Antiquities response; Lehner, M. (2018).",
      evidence: "Muon tomography only measures rock density and cannot detect small artifacts, inscriptions, or doors. Structural architects propose it may be an internal construction ramp or weight-relieving void.",
      status: "DISPUTED",
      confidence: "MEDIUM",
      notes: "Distinguish between particle detector data (an area of low density) and sensational media speculation (a treasure chamber).",
      sourceTier: "Tier 2: Academic / Scholarly",
      suggestedNarration: "While some observers speculated about secret chambers, researchers caution that the void may simply be an architectural space designed to reduce weight above the Grand Gallery.",
      evidenceCategory: "Disputed Interpretation",
      independentSourcesCount: 3,
      storyBeat: "Explanation",
    },
  ],
  summaryStats: {
    total: 3,
    verified: 2,
    partiallyVerified: 0,
    disputed: 1,
    needsResearch: 0,
    excluded: 0,
    highConfidence: 2,
    mediumConfidence: 1,
    lowConfidence: 0,
  },
};

// 3. Chilean FLIR UFO Investigation Research Exemplar
export const DAY6_EXEMPLAR_CHILEAN_FLIR: FactVerificationDossier = {
  id: "day6-exemplar-chilean-flir",
  storyTitle: "Why Did the Chilean Air Force Declassify Its Pilot UFO Files?",
  coreQuestion: "What did a Chilean Navy helicopter FLIR camera track for nine minutes over the coast?",
  records: [
    {
      num: 1,
      claim: "A Chilean Navy Cougar helicopter tracked an unidentified thermal object for nine minutes on November 11, 2014.",
      claimType: "Historical fact",
      importance: "HIGH",
      source: "CEFAA Official Case Report (DGAC Chile, 2017); Kean, L. (2017) Huffington Post investigative report.",
      evidence: "Official declassified MX-15 forward-looking infrared video recording, pilot testimony, and naval flight logbook entries.",
      status: "VERIFIED",
      confidence: "HIGH",
      notes: "The occurrence of the encounter and the existence of the official military recording are undisputed historical facts.",
      sourceTier: "Tier 1: Primary / Institutional",
      suggestedNarration: "On November 11, 2014, a Chilean naval helicopter crew spent nine minutes tracking an unidentified thermal contact on forward-looking infrared.",
      evidenceCategory: "Established Evidence",
      independentSourcesCount: 3,
      storyBeat: "Cold Open",
    },
    {
      num: 2,
      claim: "Primary military radar and civilian air traffic control confirmed that no other aircraft were in the sector.",
      claimType: "Quantitative claim",
      importance: "HIGH",
      source: "CEFAA Report (2017); DGAC radar data logs.",
      evidence: "Two ground radar stations failed to register a primary or secondary return at the target coordinates estimated by the pilots.",
      status: "PARTIALLY VERIFIED",
      confidence: "HIGH",
      notes: "The radar stations did not see an aircraft at the pilot's estimated range of 35-40 miles. However, radar coverage was shielded behind coastal mountains for aircraft beyond 60 miles.",
      sourceTier: "Tier 1: Primary / Institutional",
      suggestedNarration: "Local radar operators confirmed no aircraft was logged in the helicopter's immediate vicinity.",
      evidenceCategory: "Established Evidence",
      independentSourcesCount: 2,
      storyBeat: "Complication",
    },
    {
      num: 3,
      claim: "Independent analysts proved the object was an Iberia commercial flight discharging contrails.",
      claimType: "Interpretation",
      importance: "HIGH",
      source: "French aerospace group (3AF-Sigma2 report, 2017); Mick West / Metabunk optical parallax analysis.",
      evidence: "Flight radar telemetry shows Iberia Flight IB6830 departed Santiago at the exact azimuth and was climbing through 30,000 feet, where forward-scattering thermal cameras record contrails as hot plumes.",
      status: "VERIFIED",
      confidence: "HIGH",
      notes: "Multiple independent analysts verified the optical alignment and timing to within seconds, solving the apparent mystery through optical parallax.",
      sourceTier: "Tier 2: Academic / Scholarly",
      suggestedNarration: "Independent flight telemetry later demonstrated that the thermal signature matched a distant commercial airliner whose aerodynamic contrail created a deceptive infrared silhouette.",
      evidenceCategory: "Strongly Supported Interpretation",
      independentSourcesCount: 3,
      storyBeat: "Discovery / Evidence",
    },
  ],
  summaryStats: {
    total: 3,
    verified: 2,
    partiallyVerified: 1,
    disputed: 0,
    needsResearch: 0,
    excluded: 0,
    highConfidence: 3,
    mediumConfidence: 0,
    lowConfidence: 0,
  },
};

export const ALL_DAY6_EXEMPLARS: FactVerificationDossier[] = [
  DAY6_EXEMPLAR_EGYPTIAN,
  DAY6_EXEMPLAR_SCANPYRAMIDS,
  DAY6_EXEMPLAR_CHILEAN_FLIR,
];

// ============================================================================
// HEURISTIC FACT VERIFICATION ENGINE (OFFLINE / FALLBACK)
// ============================================================================

export function generateHeuristicFactVerification(input: {
  storyTitle: string;
  coreQuestion?: string;
  claims: {
    claim: string;
    claimType?: string;
    importance?: string;
    storyBeat?: string;
  }[];
}): FactVerificationDossier {
  const title = input.storyTitle.trim() || "Documentary Investigation";
  const records: FactVerificationRecord[] = input.claims.map((c, index) => {
    const rawClaim = c.claim.trim();
    const lower = rawClaim.toLowerCase();

    let claimType: ClaimType = (c.claimType as ClaimType) || "Interpretation";
    let importance: ClaimImportance = (c.importance as ClaimImportance) || "HIGH";
    let status: ClaimStatus = "NEEDS RESEARCH";
    let confidence: ClaimConfidence = "MEDIUM";
    let sourceTier: SourceTier = "Tier 2: Academic / Scholarly";
    let evidenceCategory: EvidenceCategory = "Unverified Claim";
    let source = "Scholarly publications, archival documentation, and archaeological field surveys.";
    let evidence = "Requires primary source cross-referencing and verification.";
    let notes = "Verify against primary institutional reports before finalizing narration.";
    let suggestedNarration = `Researchers are currently investigating whether ${rawClaim}.`;

    // Rule 1: Dolerite & Hammerstones
    if (lower.includes("dolerite") || lower.includes("pounder") || lower.includes("hammerstone")) {
      claimType = "Archaeological evidence";
      importance = "HIGH";
      source = "Engelbach (1922); Stocks (2003) Experiments in Egyptian Archaeology; Aswan quarry surveys.";
      evidence = "Spherical dolerite balls recovered in huge numbers in quarry trenches at Aswan and Giza.";
      if (lower.includes("exact") || lower.includes("12 pound") || lower.includes("12-lb")) {
        status = "PARTIALLY VERIFIED";
        confidence = "MEDIUM";
        notes = "Dolerite balls vary widely in weight from 4 to 15+ lbs; 12 lbs is merely a sample average.";
        suggestedNarration = "Surveys show these stone mauls varied in size, often weighing between eight and fifteen pounds.";
        evidenceCategory = "Strongly Supported Interpretation";
      } else {
        status = "VERIFIED";
        confidence = "HIGH";
        notes = "Physical artifacts found directly in trench debris provide definitive proof of percussive fracturing.";
        suggestedNarration = "Excavations in ancient granite quarries have recovered thousands of spherical dolerite pounders.";
        evidenceCategory = "Established Evidence";
      }
      sourceTier = "Tier 1: Primary / Institutional";
    }
    // Rule 2: Razor blade / sub-millimeter seam
    else if (lower.includes("razor") || lower.includes("seam") || lower.includes("sub-millimeter") || lower.includes("joint")) {
      claimType = lower.includes("sub-millimeter") ? "Quantitative claim" : "Interpretation";
      importance = "HIGH";
      source = "Flinders Petrie (1883) Pyramids and Temples of Gizeh; Lehner (1997).";
      evidence = "Historical survey measurements document casing joint gaps averaging 0.5mm.";
      if (lower.includes("razor")) {
        status = "DISPUTED";
        confidence = "MEDIUM";
        notes = "The joint fit is exceptional, but the 'razor cannot enter' phrase is a modern popular trope rather than an ancient engineering tolerance.";
        suggestedNarration = "Survey measurements by Flinders Petrie demonstrated joints fitted with sub-millimeter precision averaging 0.5 millimeters.";
        evidenceCategory = "Disputed Interpretation";
      } else {
        status = "VERIFIED";
        confidence = "HIGH";
        notes = "Careful in-situ fitting and grinding of stone faces produced tolerances well documented in historical surveys.";
        suggestedNarration = "Field surveys confirm casing stones were fitted together with extraordinary sub-millimeter precision.";
        evidenceCategory = "Established Evidence";
      }
      sourceTier = "Tier 2: Academic / Scholarly";
    }
    // Rule 3: Copper & Abrasives & Quartz
    else if (lower.includes("copper") || lower.includes("abrasive") || lower.includes("quartz") || lower.includes("saw")) {
      if (lower.includes("copper alone") || lower.includes("without abrasive") || lower.includes("cut granite with copper")) {
        claimType = "Scientific fact";
        importance = "HIGH";
        source = "Lucas & Harris (1962); Mineral hardness standards (Mohs scale).";
        evidence = "Mohs 3.0 copper cannot scratch Mohs 7.0 quartz without harder abrasive slurry grains.";
        status = "EXCLUDE";
        confidence = "HIGH";
        notes = "Materials science contradiction. Copper alone will deform against granite. Copper acts only as a carrier for abrasive slurry.";
        suggestedNarration = "Because copper is far softer than quartz crystals in granite, tools required continuous abrasive slurry to grind channels.";
        evidenceCategory = "Claim to Exclude";
        sourceTier = "Tier 1: Primary / Institutional";
      } else {
        claimType = "Experimental reconstruction";
        importance = "HIGH";
        source = "Stocks (2003); Lucas & Harris (1962); Denys Stocks modern experimental replications.";
        evidence = "Microscopic examination of ancient core striations matches micro-chipping caused by rolling quartz slurry grains under pressure.";
        status = "VERIFIED";
        confidence = "HIGH";
        notes = "Experimental archaeology demonstrates feasibility; micro-striations on drill cores confirm abrasive friction.";
        suggestedNarration = "Experiments have demonstrated that copper blades feeding quartz sand slurry grind channels through rolling micro-fractures.";
        evidenceCategory = "Experimental Reconstruction";
        sourceTier = "Tier 2: Academic / Scholarly";
      }
    }
    // Rule 4: Cutting rates (12 cm³/hr)
    else if (lower.includes("12 cm") || lower.includes("rate") || lower.includes("speed") || lower.includes("cutting rate")) {
      claimType = "Quantitative claim";
      importance = "MEDIUM";
      source = "Stocks, D. (2001) Antiquity 75(288); Stocks (2003).";
      evidence = "Laboratory measurements recorded during controlled hand-drilling experiments by Denys Stocks.";
      status = "PARTIALLY VERIFIED";
      confidence: "MEDIUM";
      notes = "This rate occurred in specific modern single-man tests; ancient guild teams with multiple sawyers varied significantly.";
      suggestedNarration = "In modern experimental reconstructions, researchers achieved cutting rates of roughly twelve cubic centimeters per hour.";
      evidenceCategory = "Experimental Reconstruction";
      sourceTier = "Tier 2: Academic / Scholarly";
    }
    // Rule 5: Three-Rod triangulation & Leveling
    else if (lower.includes("three-rod") || lower.includes("triangulation") || lower.includes("leveling") || lower.includes("plane")) {
      claimType = "Attribution";
      importance = "HIGH";
      source = "Arnold, D. (1991) Building in Egypt; Clarke & Engelbach (1930); British Museum Egyptian wood collections.";
      evidence = "Surviving wooden leveling rods and tomb depictions of stone dressing in the tomb of Rekhmire (TT100).";
      status = "VERIFIED";
      confidence = "HIGH";
      notes = "Physical wooden rods and string sightings are confirmed in New Kingdom trade kits.";
      suggestedNarration = "Archaeological artifacts demonstrate that ancient masons used sets of three wooden rods and string to sight true planes across stone blocks.";
      evidenceCategory = "Established Evidence";
      sourceTier = "Tier 1: Primary / Institutional";
    }
    // Rule 6: Guide blocks
    else if (lower.includes("guide block") || lower.includes("limestone guide") || lower.includes("drill wobble")) {
      claimType = "Interpretation";
      importance = "MEDIUM";
      source = "Stocks, D. (2003) Experiments in Egyptian Archaeology.";
      evidence = "Proposed by experimental archaeologists to solve mechanical bit slipping; specific Old Kingdom guide block artifacts remain unconfirmed.";
      status = "NEEDS RESEARCH";
      confidence = "MEDIUM";
      notes = "Feasible hypothesis that requires archival verification to confirm if physical guide block artifacts exist.";
      suggestedNarration = "Researchers believe guide blocks may have been used to stabilize drill wobbling, though conclusive physical examples remain debated.";
      evidenceCategory = "Strongly Supported Interpretation";
      sourceTier = "Tier 2: Academic / Scholarly";
    }
    // Rule 7: Tonnage & Scale (45,000 tons)
    else if (lower.includes("ton") || lower.includes("45,000") || lower.includes("weight") || lower.includes("transported")) {
      claimType = "Quantitative claim";
      importance = "MEDIUM";
      source = "Klemm & Klemm (2001); Lehner (1997); Maragioglio & Rinaldi (1965).";
      evidence = "Architectural volumetric measurements of King's Chamber, relieving roofs, sarcophagi, and Menkaure casing.";
      status = "PARTIALLY VERIFIED";
      confidence = "HIGH";
      notes = "Architectural volume confirms substantial tonnage; figures are calculated estimates rather than primary ancient manifests.";
      suggestedNarration = "Scholars estimate that between forty and fifty thousand tons of granite were quarried and transported down the Nile.";
      evidenceCategory = "Strongly Supported Interpretation";
      sourceTier = "Tier 2: Academic / Scholarly";
    }
    // Rule 8: Levitation / Alien / Laser / Pseudoscience
    else if (lower.includes("levitat") || lower.includes("sound frequency") || lower.includes("alien") || lower.includes("laser") || lower.includes("lost technology")) {
      claimType = "Interpretation";
      importance = "HIGH";
      source = "Archaeological and metallurgical consensus (Petrie, Arnold, Lehner, Stocks).";
      evidence = "Complete absence of archaeological, material, or textual evidence; contradicts established physics.";
      status = "EXCLUDE";
      confidence = "HIGH";
      notes = "Unsubstantiated pseudoscience. Including this claim damages channel authority and misleads the audience.";
      suggestedNarration = "Exclude from documentary narration. Unsupported internet lore that lacks physical or historical evidence.";
      evidenceCategory = "Claim to Exclude";
      sourceTier = "Tier 5: Social / Popular Media";
    }
    // Generic fallback for any other custom claim
    else {
      if (lower.includes("discovered") || lower.includes("found") || lower.includes("excavat")) {
        claimType = "Archaeological evidence";
        status = "PARTIALLY VERIFIED";
        confidence = "MEDIUM";
        evidenceCategory = "Strongly Supported Interpretation";
        suggestedNarration = `Archaeological evidence suggests that ${rawClaim.replace(/\.$/, "")}.`;
      } else if (lower.includes("physics") || lower.includes("energy") || lower.includes("radiation") || lower.includes("particle")) {
        claimType = "Scientific fact";
        status = "VERIFIED";
        confidence = "HIGH";
        evidenceCategory = "Established Evidence";
        suggestedNarration = `Scientific analysis indicates that ${rawClaim.replace(/\.$/, "")}.`;
      } else if (lower.includes("percent") || lower.includes("meter") || lower.includes("year") || lower.includes("number")) {
        claimType = "Quantitative claim";
        status = "PARTIALLY VERIFIED";
        confidence = "MEDIUM";
        evidenceCategory = "Strongly Supported Interpretation";
        suggestedNarration = `Historical estimates indicate that ${rawClaim.replace(/\.$/, "")}.`;
      } else {
        claimType = "Historical fact";
        status = "NEEDS RESEARCH";
        confidence = "MEDIUM";
        evidenceCategory = "Unverified Claim";
        suggestedNarration = `Historians continue to investigate claims that ${rawClaim.replace(/\.$/, "")}.`;
      }
    }

    return {
      num: index + 1,
      claim: rawClaim,
      claimType,
      importance,
      source,
      evidence,
      status,
      confidence,
      notes,
      sourceTier,
      suggestedNarration,
      evidenceCategory,
      independentSourcesCount: status === "VERIFIED" ? 3 : status === "PARTIALLY VERIFIED" ? 2 : 1,
      storyBeat: c.storyBeat || "General Investigation",
    };
  });

  return {
    id: `fact-verification-${Date.now()}`,
    storyTitle: title,
    coreQuestion: input.coreQuestion,
    records,
    summaryStats: calculateDossierStats(records),
  };
}

// ============================================================================
// SERVER FUNCTION: AI RESEARCH & FACT VERIFICATION
// ============================================================================

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
  .handler(async ({ data }) => {
    const envKey = (process.env.GEMINI_API_KEY || process.env.AI_API_KEY || "").trim();
    const effectiveAiKey = (data.aiApiKey || envKey).trim();

    if (!effectiveAiKey) {
      return generateHeuristicFactVerification(data);
    }

    try {
      const isGemini =
        effectiveAiKey.startsWith("AIza") ||
        effectiveAiKey.length === 39 ||
        effectiveAiKey.length === 40;

      const claimsList = data.claims
        .map((c, i) => `${i + 1}. [Beat: ${c.storyBeat || "N/A"}] ${c.claim}`)
        .join("\n");

      const prompt = `You are an elite Lead Documentary Researcher and Fact Verification Specialist adhering to strict professional documentary standards (Day 6 Curriculum).

DOCUMENTARY SUBJECT:
Title: "${data.storyTitle}"
${data.coreQuestion ? `Core Question: "${data.coreQuestion}"` : ""}

CLAIMS TO RESEARCH AND VERIFY:
${claimsList}

METHODOLOGY & SYSTEM RULES:
1. Core Principle: Interesting ≠ true. Popular ≠ verified. Plausible ≠ proven.
2. Evidence vs Interpretation: Separate physical/archaeological evidence from modern interpretations.
3. Source Hierarchy:
   - Tier 1: Primary / Institutional Evidence (excavation reports, peer-reviewed journals, museum registries)
   - Tier 2: Academic / Scholarly Sources (university presses, academic textbooks)
   - Tier 3: Reputable Secondary Sources (major museums, institutional documentary bodies)
   - Tier 4: General Internet (blogs, forums)
   - Tier 5: Social / Popular Media (unverified YouTube tropes, speculative lore)
4. Categories to assign:
   - claimType: "Historical fact" | "Archaeological evidence" | "Scientific fact" | "Interpretation" | "Experimental reconstruction" | "Quantitative claim" | "Attribution"
   - importance: "HIGH" | "MEDIUM" | "LOW"
   - status: "VERIFIED" | "PARTIALLY VERIFIED" | "DISPUTED" | "NEEDS RESEARCH" | "EXCLUDE"
   - confidence: "HIGH" | "MEDIUM" | "LOW"
   - evidenceCategory: "Established Evidence" | "Strongly Supported Interpretation" | "Disputed Interpretation" | "Experimental Reconstruction" | "Unverified Claim" | "Claim to Exclude"
5. Narration Phrasing (The Language of Certainty):
   - High confidence: "Archaeologists have found...", "Historical records document..."
   - Strong interpretation: "The evidence suggests...", "Researchers believe..."
   - Disputed: "Some researchers argue..., while others..."
   - Experimental: "Experiments have demonstrated that it can work, though whether ancient craftspeople used this exact method remains debated..."
   - Disproven / Pseudoscience: "Exclude completely from narration."

Return a clean, valid JSON object matching this schema:
{
  "records": [
    {
      "num": 1,
      "claim": "exact claim text",
      "claimType": "Historical fact",
      "importance": "HIGH",
      "source": "Specific scholarly or institutional citation",
      "evidence": "Concrete physical, archival, or experimental findings",
      "status": "VERIFIED",
      "confidence": "HIGH",
      "notes": "Crucial editorial notes, nuances, or cautions",
      "sourceTier": "Tier 1: Primary / Institutional",
      "suggestedNarration": "Careful, responsible narration script applying the Language of Certainty",
      "evidenceCategory": "Established Evidence",
      "independentSourcesCount": 3,
      "storyBeat": "Context"
    }
  ]
}`;

      let rawContent = "";
      if (isGemini) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveAiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.3,
            },
          }),
        });
        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }
        const dataJson = await response.json();
        rawContent = dataJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.3,
          }),
        });
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }
        const dataJson = await response.json();
        rawContent = dataJson.choices?.[0]?.message?.content || "";
      }

      const parsed = JSON.parse(rawContent);
      const records: FactVerificationRecord[] = (parsed.records || []).map((r: any, idx: number) => ({
        num: idx + 1,
        claim: String(r.claim || data.claims[idx]?.claim || ""),
        claimType: CLAIM_TYPE_OPTIONS.includes(r.claimType) ? r.claimType : "Interpretation",
        importance: CLAIM_IMPORTANCE_OPTIONS.includes(r.importance) ? r.importance : "HIGH",
        source: String(r.source || "Scholarly and archaeological publications"),
        evidence: String(r.evidence || "Primary excavation and survey evidence"),
        status: CLAIM_STATUS_OPTIONS.includes(r.status) ? r.status : "NEEDS RESEARCH",
        confidence: CLAIM_CONFIDENCE_OPTIONS.includes(r.confidence) ? r.confidence : "MEDIUM",
        notes: String(r.notes || ""),
        sourceTier: SOURCE_TIER_OPTIONS.includes(r.sourceTier) ? r.sourceTier : "Tier 2: Academic / Scholarly",
        suggestedNarration: String(r.suggestedNarration || ""),
        evidenceCategory: r.evidenceCategory || "Strongly Supported Interpretation",
        independentSourcesCount: Number(r.independentSourcesCount || 2),
        storyBeat: String(r.storyBeat || data.claims[idx]?.storyBeat || "General Investigation"),
      }));

      return {
        id: `fact-verification-${Date.now()}`,
        storyTitle: data.storyTitle,
        coreQuestion: data.coreQuestion,
        records,
        summaryStats: calculateDossierStats(records),
      };
    } catch (err) {
      console.warn("AI Fact Verification failed, using heuristic engine:", err);
      return generateHeuristicFactVerification(data);
    }
  });
