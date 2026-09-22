import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

// Catalog of the 16 Proven Primary Patterns and Short Codes
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
    description: "Concealed, restricted, forbidden, or hidden knowledge kept behind closed doors.",
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
    sampleTrigger: "Cleanroom engineering, raw elements to finished product, micro-precision assembly.",
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
    id: "ig",
    code: "IG",
    pattern: "Information Gap",
    focus: "Missing Piece / Vanished Past",
    description: "Intriguing mystery with a missing piece, sudden abandonment, or erased chronicle.",
    sampleTrigger: "Sudden unexplained evacuation, missing historical chapters, blank spots in archives.",
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
    sampleTrigger: "5 shocking facts, 7 fatal mistakes, top 6 mind-bending realities, 3 bizarre clues.",
  },
  {
    id: "q",
    code: "Q",
    pattern: "Question",
    focus: "Provocative Hypothetical Question",
    description: "Open provocative question, deep dilemma, philosophical puzzle, or survival test.",
    sampleTrigger: "What would happen if..., could humanity survive..., why did builders risk everything...",
  },
  {
    id: "s",
    code: "S",
    pattern: "Superlative",
    focus: "Peak Extremes & Records",
    description: "Peak extremes, the absolute deadliest, largest, rarest, or most dangerous on record.",
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
    focus: "Firsthand Immersion & POV",
    description: "Immersive firsthand journey, simulation, restricted access walkthrough, or survival test.",
    sampleTrigger: "24-hour survival challenge, uncensored walkthrough, what it actually feels like inside.",
  },
];

export interface TitleResultItem {
  id: string;
  num: number;
  topic: string;
  angle: string;
  code: string;
  pattern: string;
  workingTitle: string;
}

const GenerateTitlesInput = z.object({
  topics: z.array(z.string().trim().min(1)).min(1),
  anglesPerTopic: z.number().int().min(1).max(5).default(1),
  aiApiKey: z.string().trim().optional(),
});

// Topic-aware contextual knowledge for natural heuristic generation
const TOPIC_KNOWLEDGE_BASE: Record<
  string,
  {
    angles: string[];
    entities: string[];
  }
> = {
  egypt: {
    angles: ["Engineering", "Discovery", "Lost Technology", "Royal Curses", "Buried Tombs", "Sacred Architecture"],
    entities: [
      "the Great Pyramids",
      "1,000-ton granite obelisks",
      "precision stone-cutting saws",
      "Tutankhamun's subterranean vault",
      "ancient quarrying technology",
      "undisturbed royal crypts",
    ],
  },
  antarctica: {
    angles: ["Discovery", "Subglacial Lakes", "Prehistoric Radar", "Ice Core Anomalies", "Deep Station Isolation"],
    entities: [
      "Lake Vostok",
      "two-mile-deep ice sheets",
      "ancient subglacial river systems",
      "isolated research outposts",
      "sub-ice magnetic anomalies",
    ],
  },
  rome: {
    angles: ["Technology", "Hydraulic Engineering", "Lost Legions", "Colosseum Secrets", "Concrete Durability"],
    entities: [
      "self-healing Roman concrete",
      "aqueduct hydraulic precision",
      "the lost Ninth Legion",
      "subterranean Colosseum lift machinery",
      "imperial road networks",
    ],
  },
  space: {
    angles: ["Question", "Black Hole Physics", "Lost Satellites", "Moon Anomalies", "Interstellar Horizon"],
    entities: [
      "supermassive black holes",
      "rogue wandering planets",
      "lunar lava tube caverns",
      "the cosmic event horizon",
      "deep-space radio bursts",
    ],
  },
  medicine: {
    angles: ["Unexpected", "Ancient Surgery", "Toxic Treatments", "Herbal Alchemy", "Plague Survival"],
    entities: [
      "skull trepanation techniques",
      "mercury and arsenic elixirs",
      "battlefield surgical tools",
      "medieval plague doctor remedies",
      "ancient herbal anesthetics",
    ],
  },
  ocean: {
    angles: ["Mystery", "Mariana Trench", "Ghost Ships", "Abyssal Creatures", "Bermuda Triangle"],
    entities: [
      "Mariana Trench extreme pressure zones",
      "the ghost ship Mary Celeste",
      "bioluminescent deep-sea predators",
      "submerged megalithic structures",
      "unmapped abyssal trenches",
    ],
  },
  city: {
    angles: ["Information Gap", "Underground Networks", "Sudden Abandonment", "Lost Fortresses", "Submerged Temples"],
    entities: [
      "Derinkuyu underground complex",
      "Mohenjo-daro's sudden abandonment",
      "Amazonian LiDAR metropolises",
      "sunken Yonaguni megaliths",
      "desert cliffside citadels",
    ],
  },
};

function getTopicContext(rawTopic: string) {
  const lower = rawTopic.toLowerCase().trim();
  for (const [k, v] of Object.entries(TOPIC_KNOWLEDGE_BASE)) {
    if (lower.includes(k) || k.includes(lower)) {
      return { topicName: rawTopic, ...v };
    }
  }

  // Dynamic contextual angles and entities for any arbitrary topic
  return {
    topicName: rawTopic,
    angles: [
      "Engineering",
      "Discovery",
      "Hidden Reality",
      "Radical Innovation",
      "Critical Breaking Point",
      "The Unspoken Rules",
      "Origins & Evolution",
      "Pioneers",
    ],
    entities: [
      `${rawTopic} systems`,
      `the underlying mechanics of ${rawTopic}`,
      `the untold side of ${rawTopic}`,
      `revolutionary breakthroughs in ${rawTopic}`,
      `the critical tipping point of ${rawTopic}`,
    ],
  };
}

// Synthesize title without predetermined start statements
function synthesizeHeuristicTitle(
  topic: string,
  angle: string,
  code: string,
  entity: string,
): string {
  const t = topic.trim();
  const a = angle.trim();
  const e = entity || `${t}'s ${a}`;

  const generators: Record<string, (() => string)[]> = {
    CG: [
      () => `Mastering ${t} (${a}): The Definitive Visual Breakdown`,
      () => `Decoding ${e}: A Complete Step-by-Step Blueprint`,
      () => `${t} Masterclass: Everything About ${a} Explained in Depth`,
      () => `How to Truly Understand ${e} in 2026`,
      () => `From Foundations to Mastery: Navigating ${t}'s ${a}`,
      () => `${a} Inside ${t}: The Complete Field Guide`,
    ],
    D: [
      () => `Deep Beneath ${t}, Scientists Just Detected an Anomalous ${a}`,
      () => `Excavations at ${t} Yielded a Startling Finding: ${e}`,
      () => `${t} Just Revealed Something Nobody Thought Existed: ${e}`,
      () => `"We Didn't Expect This": Startling Evidence of ${a} in ${t}`,
      () => `Satellite Scans Over ${t} Pinpoint an Unprecedented ${a}`,
      () => `Drilling Deep Into ${t}: What Researchers Actually Discovered About ${a}`,
    ],
    FS: [
      () => `Redacted Archives: The Censored Truth of ${e}`,
      () => `Locked Behind Heavy Doors: ${t}'s Most Guarded ${a}`,
      () => `"Do Not Release This": The Suppressed Records on ${e}`,
      () => `Classified Files Expose What Truly Happened to ${t}'s ${a}`,
      () => `${t}'s Darkest Secret: Why ${e} Was Erased From History`,
      () => `Behind Closed Doors: The Forbidden Story of ${t}'s ${a}`,
    ],
    FQ: [
      () => `2035 Horizon: What ${t}'s Next ${a} Means for Our World`,
      () => `Could ${e} Trigger an Irreversible Collapse?`,
      () => `Imagine If ${e} Suddenly Vanished Overnight`,
      () => `Are We Approaching the Breaking Point of ${t}'s ${a}?`,
      () => `When ${e} Reaches Its Limit, This Is What Happens Next`,
      () => `If ${t}'s ${a} Fails, Here Is the Real Domino Effect`,
    ],
    ht_hidden: [
      () => `Almost Everything We Believed About ${e} Is Inaccurate`,
      () => `Debunking the Biggest Myth Surrounding ${t} and Its ${a}`,
      () => `Behind Closed Doors: The Unfiltered Reality of ${e}`,
      () => `${t} Has a Dark Reality That Nobody Discusses: ${a}`,
      () => `Historians Reluctantly Admit the Uncomfortable Truth About ${e}`,
      () => `We Were Taught a Lie: The Real Story of ${t}'s ${a}`,
    ],
    HE: [
      () => `The Single Day That Changed ${e} Forever`,
      () => `Inside the Critical 48 Hours That Decided ${t}'s ${a}`,
      () => `When ${e} Collapsed and Stunned the World`,
      () => `Revisiting the Turning Point That Reshaped ${t}'s ${a}`,
      () => `${t}'s Forgotten Crisis: The Fateful Battle Over ${a}`,
      () => `From Prosperity to Ruin: The Epic Saga of ${t}'s ${a}`,
    ],
    HM: [
      () => `Inside the High-Tech Facility Crafting ${e}`,
      () => `Raw Materials to Finished Marvel: How ${t} Built ${a}`,
      () => `Watch How Master Craftsmen Assemble ${e}`,
      () => `The Microscopic Precision Demanded by ${t}'s ${a}`,
      () => `Tearing Down ${e}: What's Actually on the Inside`,
      () => `Step Inside the Secret Workshop Behind ${t}'s ${a}`,
    ],
    ht_transform: [
      () => `From Humble Beginnings to Global Dominance: ${t}'s ${a} Shift`,
      () => `How a Single Desperate Pivot Saved ${e}`,
      () => `${t}'s Radical Metamorphosis: Reinventing ${a}`,
      () => `Then vs Now: The Dramatic Leap in ${t}'s ${a}`,
      () => `Starting With Zero: The Exponential Rise of ${e}`,
    ],
    IO: [
      () => `Modern Cranes Cannot Lift What ${t} Builders Moved Every Day`,
      () => `Carved Without Steel: The Impossible Engineering of ${e}`,
      () => `This Ancient Anomaly in ${t} Defies Structural Physics: ${a}`,
      () => `Engineers Are Still Stumped by ${e}`,
      () => `Defying Gravity: The Mind-Bending Mechanics Behind ${t}'s ${a}`,
      () => `${t}'s Precision Saws: An Engineering Feat We Still Can't Replicate`,
    ],
    IG: [
      () => `Nobody Knows Why ${e} Was Suddenly Abandoned`,
      () => `Where Did ${t}'s Most Famous ${a} Disappear To?`,
      () => `Lost to History: The Unwritten Chapter of ${e}`,
      () => `Archaeologists Struck a Dead End Investigating ${t}'s ${a}`,
      () => `The Missing Clue That Still Baffles Scholars of ${e}`,
      () => `A Sudden Blank Spot in History: What Really Happened to ${t}'s ${a}?`,
    ],
    M: [
      () => `Deep Inside ${t}, an Eerie Phenomenon Baffles Researchers: ${a}`,
      () => `Something Uncanny Is Taking Place Around ${e}`,
      () => `The Cold Case That Defies Modern Science: ${t}'s ${a}`,
      () => `A Cryptic Signal From ${e} Still Haunts Scientists`,
      () => `Why Modern Instruments Keep Glitching Near ${t}'s ${a}`,
      () => `${t}'s Deepest Riddle: The Unresolved Mystery of ${a}`,
    ],
    NL: [
      () => `5 Shocking Facts About ${e} You Won't Find in Textbooks`,
      () => `7 Catastrophic Blunders in ${t}'s ${a} That Led to Disaster`,
      () => `Top 6 Mind-Bending Realities Hidden Inside ${e}`,
      () => `3 Bizarre Anomalies Documented in ${t}'s ${a}`,
      () => `${t}'s ${a}: 5 Overlooked Clues That Alter Everything`,
      () => `Ranked: The 5 Deadliest Mistakes in ${t}'s ${a}`,
    ],
    Q: [
      () => `What Would Happen If ${t} Suddenly Lost Its ${a}?`,
      () => `Could ${e} Actually Fail When We Need It Most?`,
      () => `What If We Were Completely Wrong About ${e}?`,
      () => `Is ${e} the Most Misunderstood Feat in Human History?`,
      () => `Why Did Ancient Builders Risk Everything for ${e}?`,
      () => `Will ${t}'s Evolving ${a} Save Us or Destroy Us?`,
    ],
    S: [
      () => `Earth's Most Powerful ${a} Lies Hidden in ${t}`,
      () => `The Absolute Most Dangerous ${a} Ever Documented in ${t}: ${e}`,
      () => `Breaking Every Record: The Unprecedented Scale of ${e}`,
      () => `${t}'s Most Extreme ${a}: Pushing Limits to the Edge`,
      () => `Unrivaled Scale: Inside ${t}'s Fiercest Crisis Over ${a}`,
      () => `The Rarest, Most Extreme Phenomenon in ${t}'s History: ${a}`,
    ],
    UC: [
      () => `2,000 Years Ahead of Its Time: ${e}`,
      () => `${t}'s Ancient ${a} Was Staggeringly High-Tech`,
      () => `Why Doing the Complete Opposite Saved ${e}`,
      () => `Scientists Now Confirm: ${e} Is 10x More Advanced Than Expected`,
      () => `They Laughed at ${t}'s ${a} Until New Evidence Proved It True`,
      () => `An Impossible Technological Leap Unearthed Inside ${t}'s ${a}`,
    ],
    VE: [
      () => `I Spent 24 Hours Inside ${t}'s Most Restricted ${a}`,
      () => `Step Inside ${e}: An Uncensored Walkthrough`,
      () => `What It Truly Feels Like to Experience ${e}`,
      () => `Journeying Through ${t}: An Unfiltered Expedition Into ${a}`,
      () => `Surviving the Unthinkable: Deep Dive Into ${e}`,
      () => `Behind the Security Gates: Walking Through ${t}'s ${a}`,
    ],
  };

  const pool = generators[code] || generators.CG;
  const fn = pool[Math.floor(Math.random() * pool.length)];
  return fn();
}

// Generate titles via Heuristic Engine
function generateHeuristicsBatch(
  topics: string[],
  anglesPerTopic: number,
): TitleResultItem[] {
  const results: TitleResultItem[] = [];
  const usedStartWords: string[] = [];
  let rowId = 1;

  for (const topic of topics) {
    const ctx = getTopicContext(topic);
    const anglesPool = [...ctx.angles].sort(() => Math.random() - 0.5);
    const chosenAngles = anglesPool.slice(0, anglesPerTopic);

    // If anglesPerTopic > available in pool, supplement
    while (chosenAngles.length < anglesPerTopic) {
      chosenAngles.push(`Angle ${chosenAngles.length + 1}`);
    }

    const usedMechIds = new Set<string>();

    for (let i = 0; i < chosenAngles.length; i++) {
      const angle = chosenAngles[i];

      // Pick a mechanism not yet used for this topic if possible
      let availableMechs = MECHANISMS_CATALOG.filter((m) => !usedMechIds.has(m.id));
      if (availableMechs.length === 0) availableMechs = [...MECHANISMS_CATALOG];
      const mech = availableMechs[Math.floor(Math.random() * availableMechs.length)];
      usedMechIds.add(mech.id);

      const entity = ctx.entities[i % ctx.entities.length] || `${topic}'s ${angle}`;

      // Synthesize title avoiding repeating recent start words
      let title = "";
      for (let attempt = 0; attempt < 8; attempt++) {
        const candidate = synthesizeHeuristicTitle(topic, angle, mech.id, entity);
        const startWord = candidate
          .split(/\s+/)[0]
          .replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase();

        // Enforce diversity: no duplicate start words in recent 3 items, and strictly limit "the"
        if (!usedStartWords.slice(-3).includes(startWord)) {
          title = candidate;
          usedStartWords.push(startWord);
          break;
        }
      }

      if (!title) {
        title = synthesizeHeuristicTitle(topic, angle, mech.id, entity);
        const startWord = title
          .split(/\s+/)[0]
          .replace(/[^a-zA-Z0-9]/g, "")
          .toLowerCase();
        usedStartWords.push(startWord);
      }

      results.push({
        id: `${topic}-${angle}-${mech.code}-${rowId}`,
        num: rowId++,
        topic,
        angle,
        code: mech.code,
        pattern: mech.pattern,
        workingTitle: title,
      });
    }
  }

  return results;
}

// Generate titles via Gemini API or Lovable AI Gateway
async function generateAiBatch(
  topics: string[],
  anglesPerTopic: number,
  geminiKey?: string,
  lovableKey?: string,
): Promise<TitleResultItem[] | null> {
  const mechanismsListText = MECHANISMS_CATALOG.map(
    (m) => `- ${m.pattern} (Code: ${m.code}): ${m.focus} - ${m.description}`,
  ).join("\n");

  const prompt = `You are an elite YouTube packaging expert and viral title strategist.
Generate YouTube titles following this strict formula:
Topic -> Angle -> Mechanism -> Title.

Topics to process:
${topics.map((t, idx) => `${idx + 1}. "${t}"`).join("\n")}

For EACH topic, generate exactly ${anglesPerTopic} item(s).
Available 16 Primary Patterns & Short Codes:
${mechanismsListText}

FOR EACH ANGLE GENERATED:
1. "topic": Exact topic provided.
2. "angle": A punchy 1 to 3 word thematic angle or concept (e.g. "Engineering", "Lost Technology", "Discovery", "Anomalies", "Origins", "Black Hole Physics").
3. "code": Exact 1-2 letter short code from the 16 mechanisms (e.g. "IO", "D", "UC", "Q", "M", "IG", "HT", etc.).
4. "pattern": Full name of the primary pattern (e.g. "Impossible Object", "Discovery", "Unexpected Claim/Technology").
5. "workingTitle": The viral working title built using Topic + Angle + Mechanism.

CRITICAL USER MANDATE ON TITLES:
- The Working Title MUST NOT have predetermined or repetitive start statements!
- DO NOT start every title with "The...", "How...", "Why...", "What happens when...", "7 Things...", or "Nobody knows...".
- Each title MUST be unique and have a distinct grammatical start and sentence structure (direct declarative statements, active verbs, dialogue/quotes, colon breaks, paradoxes, time or place anchors, questions).
- Even when multiple angles share the same primary pattern, their openings, rhythm, and sentence structures must be completely different so no pattern is easily recognizable.

Return a JSON array of objects with the exact schema:
[
  {
    "topic": "string",
    "angle": "string",
    "code": "string",
    "pattern": "string",
    "workingTitle": "string"
  }
]`;

  // 1. Direct Gemini API call
  if (geminiKey) {
    for (const model of ["gemini-1.5-flash", "gemini-2.0-flash"]) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
        const res = await fetch(endpoint, {
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

        if (res.ok) {
          const json = (await res.json()) as any;
          const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed.map((item: any, idx: number) => ({
                id: `${item.topic}-${item.angle}-${item.code}-${idx + 1}`,
                num: idx + 1,
                topic: String(item.topic || ""),
                angle: String(item.angle || ""),
                code: String(item.code || "UC"),
                pattern: String(item.pattern || "Viral Pattern"),
                workingTitle: String(item.workingTitle || ""),
              }));
            }
          }
        }
      } catch (err) {
        console.warn(`Gemini title generation call failed on ${model}:`, err);
      }
    }
  }

  // 2. Lovable AI Gateway
  if (lovableKey) {
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": lovableKey,
          "X-Lovable-AIG-SDK": "fetch",
        },
        body: JSON.stringify({
          model: "google/gemini-3.8-flash",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content);
          const list = Array.isArray(parsed) ? parsed : parsed.titles || parsed.results || [];
          if (Array.isArray(list) && list.length > 0) {
            return list.map((item: any, idx: number) => ({
              id: `${item.topic}-${item.angle}-${item.code}-${idx + 1}`,
              num: idx + 1,
              topic: String(item.topic || ""),
              angle: String(item.angle || ""),
              code: String(item.code || "UC"),
              pattern: String(item.pattern || "Viral Pattern"),
              workingTitle: String(item.workingTitle || ""),
            }));
          }
        }
      }
    } catch (err) {
      console.warn("Lovable AI Gateway title call failed:", err);
    }
  }

  return null;
}

// Server function exposed to frontend
export const generateTitlesServer = createServerFn({ method: "POST" })
  .validator((d: unknown) => GenerateTitlesInput.parse(d))
  .handler(async ({ data }) => {
    const { topics, anglesPerTopic, aiApiKey } = data;

    const userAiKey = aiApiKey?.trim();
    const isOpenAi = userAiKey?.startsWith("sk-");

    const geminiKey =
      (!isOpenAi ? userAiKey : undefined) ||
      process.env["GEMINI_API_KEY"] ||
      process.env["GOOGLE_API_KEY"] ||
      process.env["GOOGLE_AI_KEY"];

    const lovableKey = process.env["LOVABLE_API_KEY"];

    // Try AI generation first if key exists
    if (geminiKey || lovableKey) {
      const aiResults = await generateAiBatch(
        topics,
        anglesPerTopic,
        geminiKey,
        lovableKey,
      );
      if (aiResults && aiResults.length > 0) {
        return {
          results: aiResults,
          mode: "ai",
        };
      }
    }

    // High quality offline heuristic engine fallback
    const heuristicResults = generateHeuristicsBatch(topics, anglesPerTopic);
    return {
      results: heuristicResults,
      mode: "heuristic",
    };
  });
