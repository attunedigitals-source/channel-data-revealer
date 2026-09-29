import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { resolveAiKey } from "./server-config";
import { callAiJson } from "./ai-client.server";

// Catalog of the 16 title/packaging patterns and their short codes
export interface MechanismDefinition {
  id: string;
  code: string;
  pattern: string;
  focus: string;
  description: string;
  sampleTrigger: string;
}

export const MECHANISMS_CATALOG: MechanismDefinition[] = [
  {
    id: "cg",
    code: "CG",
    pattern: "Comprehensive Guide",
    focus: "Definitive Masterclass",
    description: "Complete, all-in-one resource, exhaustive breakdown, or beginner-to-advanced blueprint.",
    sampleTrigger: "Definitive visual walkthrough, complete field manual, zero-to-hero breakdown.",
  },
  {
    id: "d",
    code: "D",
    pattern: "Discovery",
    focus: "Startling New Finding",
    description: "Startling new scientific, historical, radar, or physical finding; unexpected reveal.",
    sampleTrigger: "Archaeological excavation, deep radar scans, satellite anomalies, unearthing the unexpected.",
  },
  {
    id: "fs",
    code: "FS",
    pattern: "Forbidden/Secret",
    focus: "Classified / Concealed Knowledge",
    description: "Concealed, restricted, forbidden, or hidden knowledge kept behind closed doors (only when documented).",
    sampleTrigger: "Redacted archives, declassified documents, banned theories, unspoken agreements.",
  },
  {
    id: "fq",
    code: "FQ",
    pattern: "Future Question",
    focus: "Speculative Future Scenario",
    description: "Speculative scenario about what happens next, impending tipping points, or future horizons.",
    sampleTrigger: "2035 projections, runaway tipping points, worst-case consequences, impending shift.",
  },
  {
    id: "ht_hidden",
    code: "HT",
    pattern: "Hidden Truth",
    focus: "Unmasking Misconceptions",
    description: "Unmasking misconceptions, exposing the uncomfortable reality, debunking popular myths.",
    sampleTrigger: "Commonly taught falsehoods, behind-the-curtain reality, counter-narrative truth.",
  },
  {
    id: "he",
    code: "HE",
    pattern: "Historical Event",
    focus: "Pivotal Historic Turning Point",
    description: "Catastrophic turning point, pivotal historical saga, disaster, or fateful decision.",
    sampleTrigger: "The single day that changed history, critical 48 hours, forgotten crisis, tragic collapse.",
  },
  {
    id: "hm",
    code: "HM",
    pattern: "How It's Made",
    focus: "Precision Craftsmanship",
    description: "Intricate manufacturing, engineering assembly, behind-the-scenes factory craftsmanship.",
    sampleTrigger: "Engineering mastery, raw elements to finished product, micro-precision assembly.",
  },
  {
    id: "ht_transform",
    code: "HT",
    pattern: "How/Transformation",
    focus: "Dramatic Evolution",
    description: "Zero-to-hero shift, radical pivot, complete metamorphosis, overcoming impossible odds.",
    sampleTrigger: "From humble origins to world power, dramatic turnaround, technological evolution.",
  },
  {
    id: "io",
    code: "IO",
    pattern: "Impossible Object",
    focus: "Engineering / Physics Anomaly",
    description: "Engineering, structural, or physical anomaly defying modern tools, weight, or logic.",
    sampleTrigger: "Megalithic stone precision, 1,000-ton monoliths, structures modern cranes cannot lift.",
  },
  {
    id: "if",
    code: "IF",
    pattern: "Information Gap",
    focus: "Missing Piece / Vanished Past",
    description: "Intriguing mystery with a missing piece, sudden decline, or erased chronicle.",
    sampleTrigger: "Sudden unexplained abandonment, missing historical chapters, blank spots in archives.",
  },
  {
    id: "m",
    code: "M",
    pattern: "Mystery",
    focus: "Unexplained Phenomenon",
    description: "Deep unresolved enigma, eerie signal, cold case, or anomaly defying explanation.",
    sampleTrigger: "Abyssal sound anomalies, unexplainable instrument glitches, unsolvable cold cases.",
  },
  {
    id: "nl",
    code: "NL",
    pattern: "Numbered List",
    focus: "Ranked Insights & Shocking Facts",
    description: "Ranked insights, shocking facts, catastrophic errors, or overlooked curiosities.",
    sampleTrigger: "5 shocking facts, 7 fatal mistakes, top 3 strange discoveries, 4 bizarre clues.",
  },
  {
    id: "q",
    code: "Q",
    pattern: "Question",
    focus: "Provocative Curiosity Question",
    description: "Open provocative question, deep dilemma, philosophical puzzle, or survival test.",
    sampleTrigger: "What would happen if..., could humanity survive..., why did builders risk everything...",
  },
  {
    id: "sf",
    code: "SF",
    pattern: "Superlative/Fascination",
    focus: "Peak Extremes & Fascination",
    description: "Peak extremes, records, sheer scale, and intense fascination with limits.",
    sampleTrigger: "Earth's most extreme anomaly, absolute deadliest phenomenon, record-shattering scale.",
  },
  {
    id: "uc",
    code: "UC",
    pattern: "Unexpected Claim/Technology",
    focus: "Ahead-of-Its-Time Innovation",
    description: "Startling claim, ancient technology centuries ahead of its era, counter-intuitive reality.",
    sampleTrigger: "2,000 years ahead of its time, high-tech ancient metallurgy, counter-intuitive genius.",
  },
  {
    id: "ve",
    code: "VE",
    pattern: "Viewer Experience",
    focus: "Firsthand Immersion & Simulation",
    description: "Immersive firsthand journey, simulation, observational walkthrough, or survival test.",
    sampleTrigger: "24-hour simulation, observational walkthrough, what it actually feels like inside.",
  },
];

export interface TitleResultItem {
  id: string;
  num: number;
  topic: string;
  factPremise: string;
  angle: string;
  code: string;
  pattern: string;
  workingTitle: string;
  curiosityQuestion: string;
  whyClick: string;
  factuallyGrounded: "YES" | "NEEDS RESEARCH" | "NO";
  visualPotential: "High" | "Exceptional" | "Medium";
}

const GenerateTitlesInput = z.object({
  topics: z.array(z.string().trim().min(1)).min(1),
  anglesPerTopic: z.number().int().min(1).max(5).default(1),
  aiApiKey: z.string().trim().optional(),
});

/**
 * Fallback when no AI key is available: neutral question templates only.
 *
 * Earlier versions shipped a ~700-line hand-written "fact base" about a few
 * specific topics and, for every OTHER topic, asserted made-up facts such as
 * "investigations into {topic} have uncovered material anomalies that prompt
 * scientific debate". This version makes no factual claims at all: the
 * premise is left blank and every row is marked NEEDS RESEARCH.
 */
const NEUTRAL_TEMPLATES: { code: string; pattern: string; angle: string; title: (t: string) => string }[] = [
  { code: "Q", pattern: "Question", angle: "Core question", title: (t) => `What Is ${t}, Really?` },
  { code: "HM", pattern: "How It's Made", angle: "How it works", title: (t) => `How Does ${t} Actually Work?` },
  { code: "HE", pattern: "Historical Event", angle: "History", title: (t) => `The History of ${t}` },
  { code: "Q", pattern: "Question", angle: "Why it matters", title: (t) => `Why Does ${t} Matter?` },
  { code: "Q", pattern: "Question", angle: "Open questions", title: (t) => `What Don't We Know About ${t}?` },
];

export function generateTitlesUnresearched(topics: string[], anglesPerTopic: number): TitleResultItem[] {
  const results: TitleResultItem[] = [];
  let rowId = 1;
  for (const raw of topics) {
    const topic = raw.trim();
    for (let i = 0; i < anglesPerTopic; i++) {
      const tpl = NEUTRAL_TEMPLATES[i % NEUTRAL_TEMPLATES.length]!;
      results.push({
        id: `${topic}-${tpl.code}-${rowId}`,
        num: rowId++,
        topic,
        factPremise: "Not generated \u2014 add an AI key in API Settings, then research this topic.",
        angle: tpl.angle,
        code: tpl.code,
        pattern: tpl.pattern,
        workingTitle: tpl.title(topic),
        curiosityQuestion: "",
        whyClick: "",
        factuallyGrounded: "NEEDS RESEARCH",
        visualPotential: "Medium",
      });
    }
  }
  return results;
}

const VISUAL = ["High", "Exceptional", "Medium"] as const;

async function generateAiBatch(
  topics: string[],
  anglesPerTopic: number,
  apiKey: string,
): Promise<TitleResultItem[] | null> {
  const mechanismsListText = MECHANISMS_CATALOG.map(
    (m) => `- Code: ${m.code} (${m.pattern}): ${m.focus} - ${m.description}`,
  ).join("\n");

  const prompt = `You are a YouTube title strategist for faceless, research-driven video channels.

Pipeline for every title: FACT/PREMISE -> ANGLE -> CURIOSITY MECHANISM -> WORKING TITLE.

RULES:
1. Curiosity must come from the real subject, not manufactured drama. No sensational superlatives, no absolute claims that overstate evidence.
2. Be specific. Narrow a broad topic to one concrete question or piece of evidence rather than a generic "unsolved mystery" framing.
3. Do not present an open question as if the answer were settled, and do not imply a conspiracy.
4. The "factPremise" must be something you are confident is true and widely documented. If you are not confident, say so plainly in that field. You cannot verify facts, so a human will check every premise; do not claim otherwise.
5. Match the topic's own field. Do not force a history or mystery framing onto topics that are about something else (finance, tech, health, hobbies, etc.).

TOPICS:
${topics.map((t, i) => `${i + 1}. "${t}"`).join("\n")}

For EACH topic generate exactly ${anglesPerTopic} item(s), choosing from these patterns:
${mechanismsListText}

Return ONLY JSON: { "titles": [ { "topic": "", "factPremise": "", "angle": "1-3 words", "code": "pattern code", "pattern": "pattern name", "workingTitle": "", "curiosityQuestion": "", "whyClick": "", "visualPotential": "High | Exceptional | Medium" } ] }`;

  try {
    const parsed = await callAiJson({ apiKey, prompt, temperature: 0.6 });
    const list = Array.isArray(parsed) ? parsed : parsed.titles || parsed.results || parsed.items || [];
    if (!Array.isArray(list) || list.length === 0) return null;
    return list.map((item: any, idx: number): TitleResultItem => ({
      id: `${item.topic}-${item.angle}-${item.code}-${idx + 1}`,
      num: idx + 1,
      topic: String(item.topic || ""),
      factPremise: String(item.factPremise || ""),
      angle: String(item.angle || ""),
      code: String(item.code || "Q"),
      pattern: String(item.pattern || ""),
      workingTitle: String(item.workingTitle || ""),
      curiosityQuestion: String(item.curiosityQuestion || ""),
      whyClick: String(item.whyClick || ""),
      // The model cannot verify its own premise, so it never gets to mark it
      // grounded. Send it through Fact Verification.
      factuallyGrounded: "NEEDS RESEARCH",
      visualPotential: (VISUAL as readonly string[]).includes(item.visualPotential) ? item.visualPotential : "Medium",
    }));
  } catch (err) {
    console.warn("AI title generation failed:", err);
    return null;
  }
}

// Server function exposed to frontend
export const generateTitlesServer = createServerFn({ method: "POST" })
  .validator((d: unknown) => GenerateTitlesInput.parse(d))
  .handler(async ({ data }) => {
    const { topics, anglesPerTopic, aiApiKey } = data;
    const apiKey = resolveAiKey(aiApiKey);

    if (apiKey) {
      const aiResults = await generateAiBatch(topics, anglesPerTopic, apiKey);
      if (aiResults && aiResults.length > 0) {
        return { results: aiResults, mode: "ai" as const };
      }
    }

    return { results: generateTitlesUnresearched(topics, anglesPerTopic), mode: "unresearched" as const };
  });
