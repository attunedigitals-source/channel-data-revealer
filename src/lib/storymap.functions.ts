import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { fetchWithTimeout, resolveAiKey, detectAiProvider } from "./server-config";

// AI generation calls can legitimately take a while; still bound them so a stalled upstream can't hang a request forever.
const aiFetch = (url: string, init?: RequestInit) => fetchWithTimeout(url, init, 60_000);

export interface StoryMapElement {
  num: number;
  storyElement: string;
  yourAnswer: string;
  notes?: string;
  isNeedsResearch?: boolean;
}

export interface First30SecondsPlan {
  visualHook0to5s: {
    timing: "0–5s";
    label: "VISUAL HOOK";
    visualShot: string;
    soundCues: string;
  };
  strangeClaim5to12s: {
    timing: "5–12s";
    label: "STRANGE FACT / EVENT / CLAIM";
    narration: string;
    visualAction: string;
  };
  question12to20s: {
    timing: "12–20s";
    label: "THE QUESTION (INFORMATION GAP)";
    narration: string;
    visualAction: string;
  };
  promise20to30s: {
    timing: "20–30s";
    label: "THE PROMISE (MISSION CONTRACT)";
    narration: string;
    visualAction: string;
  };
}

export interface EscalationStep {
  level: number;
  label: "Level 1: Interesting" | "Level 2: More Interesting" | "Level 3: Surprising" | "Level 4: Significant" | "Level 5: Revelation";
  description: string;
}

export interface OpenLoopItem {
  id: string;
  question: string;
  openedInBeat: string;
  resolvedInBeat: string;
}

export interface VisualStorytellingScene {
  shotNumber: number;
  shotType: string; // e.g. "Macro Close-Up", "Cinematic Tracking", "Slow Reveal"
  narration: string;
  visualAction: string;
  googleFlowPrompt: string;
}

export interface ResearchRequiredClaim {
  id: string;
  claim: string;
  beatOrElement: string;
  category: "Hypothesis" | "Experimental Metric" | "Popular Trope" | "Estimated Figure" | "Workshop Tooling";
  currentDraftText: string;
  verifiedAlternativeText: string;
  verificationAction: string;
  status: "needs_research" | "verified" | "reframed";
}

export interface StoryMapDossier {
  id: string;
  workingTitle: string;
  coreQuestion: string;
  premise: string;
  angle: string;
  code?: string;
  pattern?: string;
  targetViewer?: string;
  clickMotivation?: "KNOW" | "SEE" | "UNDERSTAND" | "EXPERIENCE";
  informationGap?: string;
  stakes?: string;
  visualHookPrompt?: string;
  titlePromise?: string;
  elements: StoryMapElement[]; // 12 canonical rows
  first30Seconds: First30SecondsPlan;
  escalationLadder: EscalationStep[];
  openLoops: OpenLoopItem[];
  visualScenes: VisualStorytellingScene[];
  needsResearchItems: string[];
  researchClaims?: ResearchRequiredClaim[];
  storyEngine: {
    question: string;
    investigation: string;
    complication: string;
    discovery: string;
    explanation: string;
    payoff: string;
  };
}

// 12 Standard Story Map Elements used by this tool
export const STORY_ELEMENT_NAMES = [
  "Working Title",
  "Core Question",
  "Why Does It Matter?",
  "Cold Open",
  "Big Question",
  "Context",
  "Investigation",
  "Complication",
  "Discovery / Evidence",
  "Explanation",
  "Final Payoff",
  "Closing Thought",
] as const;

// Guidance-only skeleton used when no AI key is available (or generation fails).
//
// This does NOT invent a story. Earlier versions filled every field with
// generic investigation-style narration ("an ancient document contradicts
// the archaeological findings...") that had nothing to do with the user's
// topic. Here every creative field is a prompt for the creator to answer,
// plus whatever the user actually supplied.
export function generateHeuristicStoryMap(input: {
  workingTitle: string;
  premise?: string | undefined;
  angle?: string | undefined;
  targetViewer?: string | undefined;
  clickMotivation?: string | undefined;
  informationGap?: string | undefined;
  stakes?: string | undefined;
  visualHookPrompt?: string | undefined;
  titlePromise?: string | undefined;
  aiApiKey?: string | undefined;
}): StoryMapDossier {
  const title = input.workingTitle.trim();
  const todo = (prompt: string) => `[To write] ${prompt}`;
  const coreQuestion = title.endsWith("?") ? title : todo(`State the single question this video answers about "${title}".`);
  const stakes = input.stakes?.trim() || todo("Why does the viewer care? What changes if the answer is X instead of Y?");
  const visualHookPrompt = input.visualHookPrompt?.trim() || todo("Describe the first visual that creates an instant question.");
  const titlePromise = input.titlePromise?.trim() || todo("What exactly does the video promise the viewer by the end?");
  const clickMotivation = (["KNOW", "SEE", "UNDERSTAND", "EXPERIENCE"] as const).find(
    (m) => m === input.clickMotivation?.trim().toUpperCase(),
  );

  const stage = (name: string, hint: string) => todo(`${name}: ${hint}`);
  const elements: StoryMapElement[] = [
    { num: 1, storyElement: "Working Title", yourAnswer: title },
    { num: 2, storyElement: "Core Question", yourAnswer: coreQuestion },
    { num: 3, storyElement: "Why Does It Matter?", yourAnswer: stakes },
    { num: 4, storyElement: "Cold Open", yourAnswer: stage("Cold Open", "the most striking verified fact or moment, in one or two sentences.") },
    { num: 5, storyElement: "Big Question", yourAnswer: stage("Big Question", "the question the cold open raises.") },
    { num: 6, storyElement: "Context", yourAnswer: stage("Context", "only the background the viewer needs to follow the investigation.") },
    { num: 7, storyElement: "Investigation", yourAnswer: stage("Investigation", "what evidence you examine, and where it comes from.") },
    { num: 8, storyElement: "Complication", yourAnswer: stage("Complication", "the real evidence or expert disagreement that makes the answer non-obvious.") },
    { num: 9, storyElement: "Discovery / Evidence", yourAnswer: stage("Discovery / Evidence", "the key finding, with its source.") },
    { num: 10, storyElement: "Explanation", yourAnswer: stage("Explanation", "how the evidence resolves the question.") },
    { num: 11, storyElement: "Final Payoff", yourAnswer: stage("Final Payoff", "the direct answer to the core question.") },
    { num: 12, storyElement: "Closing Thought", yourAnswer: stage("Closing Thought", "what the viewer should take away.") },
  ];

  const first30Seconds: First30SecondsPlan = {
    visualHook0to5s: { timing: "0–5s", label: "VISUAL HOOK", visualShot: visualHookPrompt, soundCues: todo("Sound design for the hook.") },
    strangeClaim5to12s: { timing: "5–12s", label: "STRANGE FACT / EVENT / CLAIM", narration: todo("One surprising, verifiable fact."), visualAction: todo("Visual that anchors the fact.") },
    question12to20s: { timing: "12–20s", label: "THE QUESTION (INFORMATION GAP)", narration: coreQuestion, visualAction: todo("Visual for the question.") },
    promise20to30s: { timing: "20–30s", label: "THE PROMISE (MISSION CONTRACT)", narration: titlePromise, visualAction: todo("Visual preview of what's coming.") },
  };

  const escalationLadder: EscalationStep[] = [
    { level: 1, label: "Level 1: Interesting", description: todo("Opening observation.") },
    { level: 2, label: "Level 2: More Interesting", description: todo("A detail that deepens it.") },
    { level: 3, label: "Level 3: Surprising", description: todo("Evidence that contradicts expectations.") },
    { level: 4, label: "Level 4: Significant", description: todo("Why it matters beyond the topic.") },
    { level: 5, label: "Level 5: Revelation", description: todo("The answer that reframes everything.") },
  ];

  return {
    id: `storymap-${Date.now()}`,
    workingTitle: title,
    coreQuestion,
    premise: input.premise?.trim() || todo("One-sentence premise."),
    angle: input.angle?.trim() || todo("Your unique angle."),
    ...(input.targetViewer?.trim() ? { targetViewer: input.targetViewer.trim() } : {}),
    ...(clickMotivation ? { clickMotivation } : {}),
    ...(input.informationGap?.trim() ? { informationGap: input.informationGap.trim() } : {}),
    stakes,
    visualHookPrompt,
    titlePromise,
    elements,
    first30Seconds,
    escalationLadder,
    openLoops: [{ id: "loop-1", question: coreQuestion, openedInBeat: "Beat 2 (Big Question)", resolvedInBeat: "Beat 7 (Final Payoff)" }],
    visualScenes: [],
    needsResearchItems: ["Every factual statement in this map still needs to be written and verified."],
    researchClaims: [],
    storyEngine: {
      question: coreQuestion,
      investigation: stage("Investigation", "what you examine."),
      complication: stage("Complication", "what complicates the answer."),
      discovery: stage("Discovery", "the key finding."),
      explanation: stage("Explanation", "how it resolves."),
      payoff: stage("Payoff", "the answer."),
    },
  };
}

// Server Function: Generate AI Story Map
const GenerateStoryMapInput = z.object({
  workingTitle: z.string().trim().min(1),
  premise: z.string().trim().optional(),
  angle: z.string().trim().optional(),
  targetViewer: z.string().trim().optional(),
  clickMotivation: z.string().trim().optional(),
  informationGap: z.string().trim().optional(),
  stakes: z.string().trim().optional(),
  visualHookPrompt: z.string().trim().optional(),
  titlePromise: z.string().trim().optional(),
  aiApiKey: z.string().trim().optional(),
});

export const generateStoryMapServer = createServerFn({ method: "POST" })
  .validator((data: unknown) => GenerateStoryMapInput.parse(data))
  .handler(async ({ data }): Promise<StoryMapDossier> => {
    const effectiveAiKey = resolveAiKey(data.aiApiKey);

    if (!effectiveAiKey) {
      return generateHeuristicStoryMap(data);
    }

    try {
      const isGemini = detectAiProvider(effectiveAiKey) === "gemini";
      const prompt = `You are a master documentary director and story architect specializing in premium YouTube documentaries (in the style of Vox, Veritasium, Lemmino, Johnny Harris, and BBC Horizon).

Follow these strict STORYTELLING RULES:
1. "A documentary is not a collection of facts. It is a sequence of questions, discoveries, complications, and answers."
2. The Documentary Story Engine: QUESTION → INVESTIGATION → COMPLICATION → DISCOVERY → EXPLANATION → PAYOFF.
3. The 7-Beat Documentary Structure:
   - Beat 1: COLD OPEN (Give reason to care immediately; DO NOT reveal the answer yet!)
   - Beat 2: THE BIG QUESTION (Mission statement and contract with the viewer)
   - Beat 3: CONTEXT (Who, Where, When, Why without being a dry textbook)
   - Beat 4: INVESTIGATION (Researchers, expeditions, tools, archival digging)
   - Beat 5: COMPLICATION (Tension, contradiction, expectation vs reality, genuine difficulty)
   - Beat 6: DISCOVERY / EXPLANATION (Earned answers, measurements, physical/historical mechanisms)
   - Beat 7: FINAL PAYOFF (Answers the central question + meaningful closing thought with depth)
4. First 30 Seconds Formula:
   - 0–5s: Visual Hook (Arresting, kinetic, macro shot)
   - 5–12s: Strange Fact / Event / Claim
   - 12–20s: Question (Information gap)
   - 20–30s: Promise (Mission contract)
6. RESEARCH DISCIPLINE & FACTUAL CERTAINTY (CRITICAL PROFESSIONAL LESSON):
   - A professional documentary workflow strictly separates:
     STORY IDEA → HYPOTHESIS → EVIDENCE → VERIFIED NARRATION
   - DO NOT automatically turn an interesting explanation, theoretical reconstruction, or experimental trial into an established historical fact in narration!
   - Distinguish documented physical evidence (artifacts, inscriptions, museum catalog finds) from experimental hypotheses (modern workshop trials, suggested jigs, theoretical rates).
   - If a claim is an unconfirmed hypothesis, modern experimental estimate, or theoretical reconstruction, explicitly flag it in yourAnswer with:
     "[Needs research: verify primary archaeological source / experimental parameters]".
   - Avoid viral sensationalist tropes (e.g. "a razor cannot enter", "impossible precision") and replace them with measured real-world metrics.

PROJECT INPUT:
- Working Title: "${data.workingTitle}"
- Premise: "${data.premise || "N/A"}"
- Angle: "${data.angle || "N/A"}"
- Target Viewer: "${data.targetViewer || "N/A"}"
- Click Motivation: "${data.clickMotivation || "KNOW"}"
- Information Gap: "${data.informationGap || "N/A"}"
- Stakes: "${data.stakes || "N/A"}"
- Visual Hook Concept: "${data.visualHookPrompt || "N/A"}"
- Title Promise: "${data.titlePromise || "N/A"}"

Return ONLY a valid JSON object matching this schema (no markdown formatting, no code fencing):
{
  "workingTitle": "string",
  "coreQuestion": "string",
  "elements": [
    { "num": 1, "storyElement": "Working Title", "yourAnswer": "string", "notes": "string" },
    { "num": 2, "storyElement": "Core Question", "yourAnswer": "string", "notes": "string" },
    { "num": 3, "storyElement": "Why Does It Matter?", "yourAnswer": "string", "notes": "string" },
    { "num": 4, "storyElement": "Cold Open", "yourAnswer": "string", "notes": "string" },
    { "num": 5, "storyElement": "Big Question", "yourAnswer": "string", "notes": "string" },
    { "num": 6, "storyElement": "Context", "yourAnswer": "string", "notes": "string" },
    { "num": 7, "storyElement": "Investigation", "yourAnswer": "string", "notes": "string" },
    { "num": 8, "storyElement": "Complication", "yourAnswer": "string", "notes": "string" },
    { "num": 9, "storyElement": "Discovery / Evidence", "yourAnswer": "string", "notes": "string" },
    { "num": 10, "storyElement": "Explanation", "yourAnswer": "string", "notes": "string" },
    { "num": 11, "storyElement": "Final Payoff", "yourAnswer": "string", "notes": "string" },
    { "num": 12, "storyElement": "Closing Thought", "yourAnswer": "string", "notes": "string" }
  ],
  "first30Seconds": {
    "visualHook0to5s": { "timing": "0–5s", "label": "VISUAL HOOK", "visualShot": "string", "soundCues": "string" },
    "strangeClaim5to12s": { "timing": "5–12s", "label": "STRANGE FACT / EVENT / CLAIM", "narration": "string", "visualAction": "string" },
    "question12to20s": { "timing": "12–20s", "label": "THE QUESTION (INFORMATION GAP)", "narration": "string", "visualAction": "string" },
    "promise20to30s": { "timing": "20–30s", "label": "THE PROMISE (MISSION CONTRACT)", "narration": "string", "visualAction": "string" }
  },
  "escalationLadder": [
    { "level": 1, "label": "Level 1: Interesting", "description": "string" },
    { "level": 2, "label": "Level 2: More Interesting", "description": "string" },
    { "level": 3, "label": "Level 3: Surprising", "description": "string" },
    { "level": 4, "label": "Level 4: Significant", "description": "string" },
    { "level": 5, "label": "Level 5: Revelation", "description": "string" }
  ],
  "openLoops": [
    { "id": "loop-1", "question": "string", "openedInBeat": "string", "resolvedInBeat": "string" },
    { "id": "loop-2", "question": "string", "openedInBeat": "string", "resolvedInBeat": "string" }
  ],
  "visualScenes": [
    { "shotNumber": 1, "shotType": "string", "narration": "string", "visualAction": "string", "googleFlowPrompt": "string" },
    { "shotNumber": 2, "shotType": "string", "narration": "string", "visualAction": "string", "googleFlowPrompt": "string" },
    { "shotNumber": 3, "shotType": "string", "narration": "string", "visualAction": "string", "googleFlowPrompt": "string" }
  ],
  "needsResearchItems": ["string"],
  "storyEngine": {
    "question": "string",
    "investigation": "string",
    "complication": "string",
    "discovery": "string",
    "explanation": "string",
    "payoff": "string"
  }
}`;

      let rawContent = "";
      if (isGemini) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveAiKey}`;
        const response = await aiFetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.7,
            },
          }),
        });
        if (!response.ok) {
          throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }
        const dataJson = await response.json();
        rawContent = dataJson.candidates?.[0]?.content?.parts?.[0]?.text || "";
      } else {
        const response = await aiFetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${effectiveAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.7,
          }),
        });
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
        }
        const dataJson = await response.json();
        rawContent = dataJson.choices?.[0]?.message?.content || "";
      }

      const parsed = JSON.parse(rawContent);

      return {
        id: `storymap-${Date.now()}`,
        workingTitle: parsed.workingTitle || data.workingTitle,
        coreQuestion: parsed.coreQuestion || data.workingTitle,
        premise: data.premise || "",
        angle: data.angle || "",
        targetViewer: data.targetViewer || "",
        clickMotivation: (data.clickMotivation as any) || "KNOW",
        informationGap: data.informationGap || "",
        stakes: data.stakes || "",
        visualHookPrompt: data.visualHookPrompt || "",
        titlePromise: data.titlePromise || "",
        elements: parsed.elements || generateHeuristicStoryMap(data).elements,
        first30Seconds: parsed.first30Seconds || generateHeuristicStoryMap(data).first30Seconds,
        escalationLadder: parsed.escalationLadder || generateHeuristicStoryMap(data).escalationLadder,
        openLoops: parsed.openLoops || generateHeuristicStoryMap(data).openLoops,
        visualScenes: parsed.visualScenes || generateHeuristicStoryMap(data).visualScenes,
        needsResearchItems: parsed.needsResearchItems || [],
        storyEngine: parsed.storyEngine || generateHeuristicStoryMap(data).storyEngine,
      };
    } catch (err) {
      console.warn("AI StoryMap generation failed, using heuristic fallback:", err);
      return generateHeuristicStoryMap(data);
    }
  });
