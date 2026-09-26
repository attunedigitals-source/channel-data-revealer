import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

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
  id?: string;
  num?: number;
  factPremise: string;
  angle: string;
  code?: string;
  pattern?: string;
  workingTitle: string;
  topic?: string;
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

// Format ratings as multiline text for Excel/CSV compatibility with "Pyschology and The Click.xlsx"
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

// 10 Exemplar Day 4 Analyzed Topics (matching Pyschology and The Click.xlsx)
export const DAY4_EXEMPLARS: PsychologyAnalysisResult[] = [
  {
    id: "exemplar-1",
    num: 1,
    factPremise: "Ancient Egyptian builders produced and fitted large stone structures using tools and techniques including stone pounders, copper tools, abrasives and sledges; the exact methods used for some precision work remain an area of archaeological study.",
    angle: "Precision Stonework",
    code: "IO",
    pattern: "Impossible Object",
    workingTitle: "How Did Ancient Egyptians Achieve Such Precise Stonework?",
    targetViewer: "People interested in ancient engineering, archaeology, physical crafts, and debunking lost-technology myths.",
    clickMotivation: "KNOW",
    informationGap: "We know colossal megaliths fit together tightly, but the exact abrasive techniques and mechanical tolerances without iron/steel tools remain actively investigated.",
    stakes: "Technological & Historical: Tests whether Bronze Age humans could achieve monumental architectural alignment using natural physics, or if modern assumptions underestimate ancient ingenuity.",
    visualHook: "Close-up cinematic macro shot of a massive diorite stone pounder repeatedly impacting crystalline granite, sending dust clouds over a colossal megalithic seam.",
    titlePromise: "The video will break down the physical experiments, copper-abrasive slurries, and quarry evidence showing how ancient masons shaped hard stone.",
    diagnosticRatings: {
      interest: 5,
      curiosity: 5,
      specificity: 5,
      stakes: 4,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 5,
      audienceRelevance: 5,
    },
    diagnosticRatingsText: formatRatingsText({
      interest: 5,
      curiosity: 5,
      specificity: 5,
      stakes: 4,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 5,
      audienceRelevance: 5,
    }),
  },
  {
    id: "exemplar-2",
    num: 2,
    factPremise: "Over two miles of ancient ice sheets bury an entire continent with mountain ranges as large as the European Alps.",
    angle: "Subglacial Geography",
    code: "IF",
    pattern: "Information Gap",
    workingTitle: "What Could Be Hidden Beneath Antarctica's Ancient Ice?",
    targetViewer: "Explorers, geography enthusiasts, documentary viewers drawn to extreme alien environments on Earth.",
    clickMotivation: "SEE",
    informationGap: "We know miles of ice cover Antarctica, but what ancient river systems, mountain peaks, and subglacial valleys actually exist underneath?",
    stakes: "Scientific & Environmental: Revealing the subglacial topography allows climatologists to model ice sheet collapse and understand Earth's climate before freezing.",
    visualHook: "Airborne radar flyover stripping away thousands of feet of blue glacial ice in 3D to reveal jagged alpine peaks and subterranean canyons beneath.",
    titlePromise: "The video will reveal modern radar and satellite gravity maps uncovering the hidden topography of the Antarctic continent.",
    diagnosticRatings: {
      interest: 5,
      curiosity: 5,
      specificity: 4,
      stakes: 4,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 4,
      audienceRelevance: 5,
    },
    diagnosticRatingsText: formatRatingsText({
      interest: 5,
      curiosity: 5,
      specificity: 4,
      stakes: 4,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 4,
      audienceRelevance: 5,
    }),
  },
  {
    id: "exemplar-3",
    num: 3,
    factPremise: "Roman marine concrete has demonstrated remarkable durability, and researchers have identified chemical processes involving volcanic materials that contribute to its long-term behavior.",
    angle: "Self-Healing Concrete",
    code: "UC",
    pattern: "Unexpected Claim/Technology",
    workingTitle: "Why Roman Concrete Survived for 2,000 Years",
    targetViewer: "Engineering fans, history buffs, civil engineering and material science curious viewers.",
    clickMotivation: "UNDERSTAND",
    informationGap: "Modern concrete degrades in seawater within decades, yet ancient Roman breakwaters remain solid after two millennia—what chemical reaction makes this possible?",
    stakes: "Technological & Environmental: Unlocking the ancient pozzolanic self-healing mechanism could revolutionize modern carbon-neutral marine construction.",
    visualHook: "Wave crashes against a 2,000-year-old submerged Roman harbor mole, dissolving into a microscopic cross-section of volcanic lime clasts recrystallizing inside seawater cracks.",
    titlePromise: "The video will explain the specific chemistry of volcanic ash and hot mixing that allows ancient concrete to repair itself over millennia.",
    diagnosticRatings: {
      interest: 5,
      curiosity: 5,
      specificity: 5,
      stakes: 5,
      visualPotential: 4,
      credibility: 5,
      storyPotential: 4,
      audienceRelevance: 5,
    },
    diagnosticRatingsText: formatRatingsText({
      interest: 5,
      curiosity: 5,
      specificity: 5,
      stakes: 5,
      visualPotential: 4,
      credibility: 5,
      storyPotential: 4,
      audienceRelevance: 5,
    }),
  },
  {
    id: "exemplar-4",
    num: 4,
    factPremise: "Near a black hole's gravitational field, gravitational time dilation significantly slows the passage of time relative to distant observers, depending on mass and proximity.",
    angle: "Black Hole Time Dilation",
    code: "Q",
    pattern: "Question",
    workingTitle: "What Would Happen If You Spent 24 Hours Near a Black Hole?",
    targetViewer: "Sci-fi fans, physics enthusiasts, existential/philosophical space documentary lovers.",
    clickMotivation: "EXPERIENCE",
    informationGap: "We know time slows down near massive objects, but what does an observer actually experience minute-by-minute while decades pass on Earth?",
    stakes: "Personal & Scientific: Directly confronts the human dilemma of leaving everyone you love behind due to the inescapable laws of general relativity.",
    visualHook: "An astronaut in a cockpit looking out at a swirling, gravitational-lensed accretion disk while a digital wrist clock ticks normally and distant stars spin at dizzying speed.",
    titlePromise: "A step-by-step human simulation of gravitational time dilation, orbital mechanics, and tidal forces during a 24-hour proximity orbit.",
    diagnosticRatings: {
      interest: 5,
      curiosity: 5,
      specificity: 5,
      stakes: 4,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 5,
      audienceRelevance: 5,
    },
    diagnosticRatingsText: formatRatingsText({
      interest: 5,
      curiosity: 5,
      specificity: 5,
      stakes: 4,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 5,
      audienceRelevance: 5,
    }),
  },
  {
    id: "exemplar-5",
    num: 5,
    factPremise: "The Edwin Smith Papyrus (c. 1600 BCE) contains 48 rational surgical case studies describing cranial sutures, brain pulsations, and trauma treatments without relying on magical incantations.",
    angle: "Rational Ancient Surgery",
    code: "D",
    pattern: "Discovery",
    workingTitle: "The 3,600-Year-Old Medical Papyrus That Pioneered Brain Surgery",
    targetViewer: "Medical history buffs, archaeology enthusiasts, science readers fascinated by ancient human anatomy.",
    clickMotivation: "KNOW",
    informationGap: "Popular culture depicts ancient medicine as witchcraft and spells, yet this ancient papyrus documented rational neurotrauma triage 1,000 years before Hippocrates.",
    stakes: "Historical: Rewrites the timeline of human medical science, proving empirical neuroanatomy originated in the Nile Valley.",
    visualHook: "Macro camera panning over weathered hieratic papyrus script, cutting to anatomical illustrations of skull fractures and copper surgical tweezers.",
    titlePromise: "The video will analyze the 48 clinical case studies, revealing how ancient Egyptian surgeons treated head wounds and diagnosed brain injuries.",
    diagnosticRatings: {
      interest: 4,
      curiosity: 5,
      specificity: 5,
      stakes: 4,
      visualPotential: 4,
      credibility: 5,
      storyPotential: 5,
      audienceRelevance: 4,
    },
    diagnosticRatingsText: formatRatingsText({
      interest: 4,
      curiosity: 5,
      specificity: 5,
      stakes: 4,
      visualPotential: 4,
      credibility: 5,
      storyPotential: 5,
      audienceRelevance: 4,
    }),
  },
  {
    id: "exemplar-6",
    num: 6,
    factPremise: "More than 75% of the ocean floor remains unmapped by high-resolution multibeam sonar, meaning we possess higher-resolution topographic maps of Mars and Venus than of Earth's seabed.",
    angle: "Unexplored Depths",
    code: "IF",
    pattern: "Information Gap",
    workingTitle: "Why Is So Little of the Deep Ocean Still Explored?",
    targetViewer: "Marine science enthusiasts, ocean lovers, fans of exploratory tech and planetary mysteries.",
    clickMotivation: "UNDERSTAND",
    informationGap: "Humanity has mapped the Moon and Mars with orbiters, so why can't satellites see through seawater to map our own planet's floor?",
    stakes: "Scientific & Environmental: The unmapped seabed hides tsunamigenic fault zones, critical marine ecosystems, and hydrothermal mineral deposits.",
    visualHook: "Split screen comparing crystal-clear radar maps of the craters of Mars against the pitch-black, murky depths of the Mariana Trench with sonar beams bouncing off silt.",
    titlePromise: "The video will explain the physical opacity of water to electromagnetic waves, extreme hadal hydrostatic pressure, and the vast scale of acoustic bathymetry.",
    diagnosticRatings: {
      interest: 5,
      curiosity: 5,
      specificity: 4,
      stakes: 4,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 4,
      audienceRelevance: 5,
    },
    diagnosticRatingsText: formatRatingsText({
      interest: 5,
      curiosity: 5,
      specificity: 4,
      stakes: 4,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 4,
      audienceRelevance: 5,
    }),
  },
  {
    id: "exemplar-7",
    num: 7,
    factPremise: "Mohenjo-daro was a large, highly organized Indus Valley settlement with sophisticated sanitation engineering whose decline around 1900 BCE remains the subject of archaeological debate.",
    angle: "Indus Valley Decline",
    code: "Q",
    pattern: "Question",
    workingTitle: "Why Did Mohenjo-daro Suddenly Decline? The Mystery of an Ancient City",
    targetViewer: "Archaeology fans, Bronze Age collapse enthusiasts, history nerds fascinated by vanished civilizations.",
    clickMotivation: "UNDERSTAND",
    informationGap: "An egalitarian urban civilization with covered sewers and brick mansions disappeared without burned layers, battle damage, or royal tombs—how did it unravel?",
    stakes: "Historical & Environmental: Offers chilling lessons on how climate megadroughts and shifting riverbeds can collapse complex urban civilizations without war.",
    visualHook: "3D recreation of Mohenjo-daro's bustling Great Bath and paved streets slowly desiccating under a blazing sun as riverbeds dry into cracked mud.",
    titlePromise: "The video will investigate competing archaeological theories—climate aridification, monsoon migration, tectonic diversion of the Ghaggar-Hakra River, and trade disruption.",
    diagnosticRatings: {
      interest: 5,
      curiosity: 5,
      specificity: 5,
      stakes: 4,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 5,
      audienceRelevance: 5,
    },
    diagnosticRatingsText: formatRatingsText({
      interest: 5,
      curiosity: 5,
      specificity: 5,
      stakes: 4,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 5,
      audienceRelevance: 5,
    }),
  },
  {
    id: "exemplar-8",
    num: 8,
    factPremise: "Etemenanki was a major Babylonian ziggurat traditionally associated by many scholars with the historical background of the Tower of Babel tradition.",
    angle: "Tower of Babel",
    code: "Q",
    pattern: "Question",
    workingTitle: "What Do We Actually Know About the Real Tower of Babel?",
    targetViewer: "Biblical history researchers, Near Eastern archaeology buffs, myth-versus-reality documentary fans.",
    clickMotivation: "KNOW",
    informationGap: "The myth speaks of a tower reaching the heavens, but what was the actual physical scale, architectural tiering, and historical fate of the Etemenanki ziggurat?",
    stakes: "Historical: Bridges ancient Near Eastern cuneiform chronicles with cultural legends, distinguishing imperial propaganda from physical archaeology.",
    visualHook: "Atmospheric sunrise over the Euphrates illuminating the colossal seven-tiered mudbrick ziggurat rising 91 meters into the Mesopotamian sky.",
    titlePromise: "The video will examine Robert Koldewey's excavations, the Esagila Tablet dimensions, and how Nebuchadnezzar II reconstructed the colossal temple tower.",
    diagnosticRatings: {
      interest: 5,
      curiosity: 5,
      specificity: 4,
      stakes: 4,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 4,
      audienceRelevance: 5,
    },
    diagnosticRatingsText: formatRatingsText({
      interest: 5,
      curiosity: 5,
      specificity: 4,
      stakes: 4,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 4,
      audienceRelevance: 5,
    }),
  },
  {
    id: "exemplar-9",
    num: 9,
    factPremise: "Deep craters near the Moon's poles, such as Shackleton Crater, contain permanently shadowed regions at -246°C where orbital neutron spectrometers confirmed vast deposits of water ice.",
    angle: "Permanently Shadowed Craters",
    code: "D",
    pattern: "Discovery",
    workingTitle: "The Deep Lunar Craters That Haven't Seen Sunlight in Two Billion Years",
    targetViewer: "Space exploration fans, Artemis mission followers, astronomy and planetary geology viewers.",
    clickMotivation: "SEE",
    informationGap: "In the airless vacuum of space baked by solar radiation, how can billions of tons of water ice remain untouched for billions of years?",
    stakes: "Technological & Scientific: These volatile ice reserves provide drinking water, oxygen, and liquid hydrogen rocket propellant for humanity's permanent lunar base.",
    visualHook: "A lunar exploration rover with high-intensity floodlights illuminating jagged crystalline ice walls deep within the pitch-black rim of Shackleton Crater.",
    titlePromise: "The video will explore the orbital physics of lunar axial tilt that creates perpetual shadows and how water ice was preserved for billions of years.",
    diagnosticRatings: {
      interest: 5,
      curiosity: 5,
      specificity: 5,
      stakes: 5,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 4,
      audienceRelevance: 5,
    },
    diagnosticRatingsText: formatRatingsText({
      interest: 5,
      curiosity: 5,
      specificity: 5,
      stakes: 5,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 4,
      audienceRelevance: 5,
    }),
  },
  {
    id: "exemplar-10",
    num: 10,
    factPremise: "Sima Qian's historical records describe Emperor Qin Shi Huang's subterranean mausoleum as containing rivers of liquid mercury, and the central burial chamber remains unopened today due to preservation and safety concerns.",
    angle: "Emperor Qin's Tomb",
    code: "M",
    pattern: "Mystery",
    workingTitle: "Why Has Emperor Qin's Central Tomb Remained Unopened?",
    targetViewer: "Ancient history buffs, archaeological mystery enthusiasts, fans of the Terracotta Army and imperial China.",
    clickMotivation: "UNDERSTAND",
    informationGap: "China excavated thousands of terracotta warriors 50 years ago, so why has the first Emperor's primary burial mound never been entered?",
    stakes: "Historical & Technological: Unopened silk, pigments, and artifacts could oxidize and disintegrate within minutes of air exposure, exactly like early terracotta paint did.",
    visualHook: "Drone flying over the massive pine-covered pyramid mound of Mount Li, transitioning into a conceptual underground cross-section with a sealed bronze sarcophagus surrounded by glistening mercury channels.",
    titlePromise: "The video will detail the preservation risks, toxic mercury soil anomalies, and the technological waiting game keeping China's first imperial tomb sealed.",
    diagnosticRatings: {
      interest: 5,
      curiosity: 5,
      specificity: 5,
      stakes: 5,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 5,
      audienceRelevance: 5,
    },
    diagnosticRatingsText: formatRatingsText({
      interest: 5,
      curiosity: 5,
      specificity: 5,
      stakes: 5,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 5,
      audienceRelevance: 5,
    }),
  },
];

// Heuristic Day 4 Analyzer for uploaded or arbitrary rows
export function analyzePsychologyHeuristic(
  items: PsychologyInputItem[],
): PsychologyAnalysisResult[] {
  return items.map((item, idx) => {
    const num = item.num || idx + 1;
    const title = item.workingTitle.trim();
    const fact = item.factPremise.trim();
    const angle = item.angle.trim();
    const code = (item.code || "Q").toUpperCase();
    const pattern = item.pattern || "Curiosity Pattern";

    // 1. Check if matches one of the 10 core exemplars
    const matchedExemplar = DAY4_EXEMPLARS.find((ex) => {
      const exTitle = ex.workingTitle.toLowerCase().replace(/[^a-z0-9]/g, "");
      const rowTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
      return exTitle === rowTitle || exTitle.includes(rowTitle) || rowTitle.includes(exTitle);
    });

    if (matchedExemplar) {
      return {
        ...matchedExemplar,
        id: item.id || `psych-${num}-${Date.now()}`,
        num,
        factPremise: fact || matchedExemplar.factPremise,
        angle: angle || matchedExemplar.angle,
        code: code || matchedExemplar.code,
        pattern: pattern || matchedExemplar.pattern,
        workingTitle: title || matchedExemplar.workingTitle,
      };
    }

    // 2. Dynamic heuristic synthesis based on Day 4 curriculum principles
    let clickMotivation: ClickMotivationType = "UNDERSTAND";
    const lowerTitle = title.toLowerCase();

    if (code === "VE" || lowerTitle.includes("what would happen if") || lowerTitle.includes("24 hours") || lowerTitle.includes("inside the")) {
      clickMotivation = "EXPERIENCE";
    } else if (code === "D" || code === "IF" || lowerTitle.startsWith("what did") || lowerTitle.includes("craters that haven't seen") || lowerTitle.includes("lakes hidden")) {
      clickMotivation = "SEE";
    } else if (code === "HM" || code === "IO" || lowerTitle.startsWith("how did") || lowerTitle.startsWith("how were") || lowerTitle.includes("how ancient")) {
      clickMotivation = "KNOW";
    } else {
      clickMotivation = "UNDERSTAND";
    }

    // Target Viewer derivation
    let targetViewer = "Documentary viewers fascinated by unsolved mysteries, history, and scientific frontiers.";
    if (lowerTitle.includes("space") || lowerTitle.includes("black hole") || lowerTitle.includes("galaxy") || lowerTitle.includes("planet") || lowerTitle.includes("moon")) {
      targetViewer = "Astronomy and space exploration fans, cosmology buffs, and sci-fi/physics enthusiasts.";
    } else if (lowerTitle.includes("egypt") || lowerTitle.includes("roman") || lowerTitle.includes("tomb") || lowerTitle.includes("ancient") || lowerTitle.includes("pyramid") || lowerTitle.includes("city")) {
      targetViewer = "History enthusiasts, archaeology buffs, and viewers drawn to ancient civilization puzzles.";
    } else if (lowerTitle.includes("ocean") || lowerTitle.includes("sea") || lowerTitle.includes("underwater") || lowerTitle.includes("antarctica")) {
      targetViewer = "Earth science and geography explorers drawn to extreme, isolated, and alien environments on our planet.";
    }

    // Information Gap formulation (Known -> Unknown -> Answer)
    const informationGap = `The viewer knows that ${angle.toLowerCase()} exists, but the precise mechanism, cause, or historical truth remains an unanswered curiosity gap.`;

    // Stakes formulation
    const stakes = `Historical & Scientific: Determining the true explanation alters our understanding of how ${angle.toLowerCase()} developed and prevents misconceptions.`;

    // Visual Hook (Mental Movie)
    const visualHook = `Cinematic documentary opening establishing the visual scale of ${angle.toLowerCase()}, utilizing micro-detail cross-sections and atmospheric lighting to build anticipation.`;

    // Title Promise
    const titlePromise = `The video promises to investigate the tangible physical and historical evidence behind "${title}", separating confirmed facts from myth.`;

    // Diagnostic ratings
    const diagnosticRatings: DiagnosticRatings = {
      interest: 5,
      curiosity: 5,
      specificity: 4,
      stakes: 4,
      visualPotential: 5,
      credibility: 5,
      storyPotential: 4,
      audienceRelevance: 5,
    };

    return {
      id: item.id || `psych-${num}-${Date.now()}`,
      num,
      factPremise: fact,
      angle,
      code,
      pattern,
      workingTitle: title,
      targetViewer,
      clickMotivation,
      informationGap,
      stakes,
      visualHook,
      titlePromise,
      diagnosticRatings,
      diagnosticRatingsText: formatRatingsText(diagnosticRatings),
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
Your framework is from Day 4 of YouTube Fundamentals & Competitive Intelligence:
"AUDIENCE PSYCHOLOGY & THE CLICK"

CORE CLICK MODEL:
CLICK = INTEREST × CURIOSITY × RELEVANCE × TRUST

THE 4 CLICK MOTIVATIONS:
1. KNOW: Viewer wants information or technique (e.g. "How Did Ancient Egyptians Move Massive Stones?").
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

DAY 4 DIAGNOSTIC RATINGS (Score each 1 to 5):
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
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
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
                interest: Number(ai.diagnosticRatings?.interest || 5),
                curiosity: Number(ai.diagnosticRatings?.curiosity || 5),
                specificity: Number(ai.diagnosticRatings?.specificity || 5),
                stakes: Number(ai.diagnosticRatings?.stakes || 4),
                visualPotential: Number(ai.diagnosticRatings?.visualPotential || 5),
                credibility: Number(ai.diagnosticRatings?.credibility || 5),
                storyPotential: Number(ai.diagnosticRatings?.storyPotential || 5),
                audienceRelevance: Number(ai.diagnosticRatings?.audienceRelevance || 5),
              };
              return {
                id: item.id || `psych-${idx + 1}-${Date.now()}`,
                num: item.num || idx + 1,
                factPremise: item.factPremise,
                angle: item.angle,
                code: item.code || "Q",
                pattern: item.pattern || "Curiosity Pattern",
                workingTitle: item.workingTitle,
                targetViewer: String(ai.targetViewer || "Documentary and science viewers."),
                clickMotivation: (["KNOW", "SEE", "UNDERSTAND", "EXPERIENCE"].includes(ai.clickMotivation)
                  ? ai.clickMotivation
                  : "UNDERSTAND") as ClickMotivationType,
                informationGap: String(ai.informationGap || "Investigates the central unanswered question."),
                stakes: String(ai.stakes || "Expands our historical and scientific understanding."),
                visualHook: String(ai.visualHook || "Cinematic visuals illustrating the core mystery."),
                titlePromise: String(ai.titlePromise || "Delivers on the core premise of the title."),
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
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": geminiKey },
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
                  interest: Number(ai.diagnosticRatings?.interest || 5),
                  curiosity: Number(ai.diagnosticRatings?.curiosity || 5),
                  specificity: Number(ai.diagnosticRatings?.specificity || 5),
                  stakes: Number(ai.diagnosticRatings?.stakes || 4),
                  visualPotential: Number(ai.diagnosticRatings?.visualPotential || 5),
                  credibility: Number(ai.diagnosticRatings?.credibility || 5),
                  storyPotential: Number(ai.diagnosticRatings?.storyPotential || 5),
                  audienceRelevance: Number(ai.diagnosticRatings?.audienceRelevance || 5),
                };
                return {
                  id: item.id || `psych-${idx + 1}-${Date.now()}`,
                  num: item.num || idx + 1,
                  factPremise: item.factPremise,
                  angle: item.angle,
                  code: item.code || "Q",
                  pattern: item.pattern || "Curiosity Pattern",
                  workingTitle: item.workingTitle,
                  targetViewer: String(ai.targetViewer || "Documentary and science viewers."),
                  clickMotivation: (["KNOW", "SEE", "UNDERSTAND", "EXPERIENCE"].includes(ai.clickMotivation)
                    ? ai.clickMotivation
                    : "UNDERSTAND") as ClickMotivationType,
                  informationGap: String(ai.informationGap || "Investigates the central unanswered question."),
                  stakes: String(ai.stakes || "Expands our historical and scientific understanding."),
                  visualHook: String(ai.visualHook || "Cinematic visuals illustrating the core mystery."),
                  titlePromise: String(ai.titlePromise || "Delivers on the core premise of the title."),
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
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                interest: Number(ai.diagnosticRatings?.interest || 5),
                curiosity: Number(ai.diagnosticRatings?.curiosity || 5),
                specificity: Number(ai.diagnosticRatings?.specificity || 5),
                stakes: Number(ai.diagnosticRatings?.stakes || 4),
                visualPotential: Number(ai.diagnosticRatings?.visualPotential || 5),
                credibility: Number(ai.diagnosticRatings?.credibility || 5),
                storyPotential: Number(ai.diagnosticRatings?.storyPotential || 5),
                audienceRelevance: Number(ai.diagnosticRatings?.audienceRelevance || 5),
              };
              return {
                id: item.id || `psych-${idx + 1}-${Date.now()}`,
                num: item.num || idx + 1,
                factPremise: item.factPremise,
                angle: item.angle,
                code: item.code || "Q",
                pattern: item.pattern || "Curiosity Pattern",
                workingTitle: item.workingTitle,
                targetViewer: String(ai.targetViewer || "Documentary and science viewers."),
                clickMotivation: (["KNOW", "SEE", "UNDERSTAND", "EXPERIENCE"].includes(ai.clickMotivation)
                  ? ai.clickMotivation
                  : "UNDERSTAND") as ClickMotivationType,
                informationGap: String(ai.informationGap || "Investigates the central unanswered question."),
                stakes: String(ai.stakes || "Expands our historical and scientific understanding."),
                visualHook: String(ai.visualHook || "Cinematic visuals illustrating the core mystery."),
                titlePromise: String(ai.titlePromise || "Delivers on the core premise of the title."),
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
    const isGemini = userAiKey?.startsWith("AIza") || userAiKey?.startsWith("AQ.");

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
          mode: "ai",
        };
      }
    }

    // 2. Fallback to rich Day 4 Heuristic Packaging Engine
    const heuristicResults = analyzePsychologyHeuristic(items);
    return {
      results: heuristicResults,
      mode: "heuristic",
    };
  });
